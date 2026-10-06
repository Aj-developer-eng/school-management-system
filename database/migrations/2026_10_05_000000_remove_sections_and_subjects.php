<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the Sections and Subjects modules.
     *
     * The base migrations no longer create any of this, so fresh installs need
     * no work at all. This migration cleans up databases built from the old
     * migrations: MySQL drops the columns directly (after their foreign keys),
     * while SQLite needs each table rebuilt because it refuses to drop a column
     * that a foreign key or index still refers to.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        $columnsByTable = [
            'student_enrollments' => ['section_id'],
            'teacher_subject_assignments' => ['section_id', 'subject_id'],
            'teacher_assignment_logs' => ['section_id', 'subject_id'],
            'tests' => ['section_id', 'subject_id'],
            'attendances' => ['section_id', 'subject_id'],
            'online_classes' => ['section_id', 'subject_id'],
            'online_class_attendances' => ['section_id'],
        ];

        foreach ($columnsByTable as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $present = array_values(array_filter(
                $columns,
                fn (string $column): bool => Schema::hasColumn($table, $column)
            ));

            if ($present === []) {
                continue;
            }

            match ($driver) {
                'sqlite' => $this->dropColumnsOnSqlite($table, $present),
                // MySQL refuses to drop a column that is still part of a foreign key.
                'mysql', 'mariadb' => $this->dropColumnsOnMysql($table, $present),
                default => $this->dropColumnsOnSqlite($table, $present),
            };
        }

        // Child tables first, then the sections/subjects tables themselves. Every
        // referencing foreign key is gone by now, so these drops are safe.
        foreach (['subject_notes', 'subject_papers', 'student_subject', 'class_subject', 'sections', 'section_categories', 'subjects'] as $table) {
            Schema::dropIfExists($table);
        }

        // Drop the now-orphaned permissions (roles cascade via Spatie's pivot).
        if (Schema::hasTable('permissions')) {
            DB::table('permissions')->whereIn('name', [
                'sections.view', 'sections.create', 'sections.update', 'sections.delete',
                'section-categories.view', 'section-categories.create', 'section-categories.update', 'section-categories.delete',
                'subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete',
                'subjects.upload-papers', 'subjects.download-papers', 'subjects.delete-papers',
                'subjects.add-notes', 'subjects.delete-notes',
            ])->delete();
        }
    }

    /**
     * Drop the columns on MySQL/MariaDB.
     *
     * A plain `dropColumn()` is blocked by three things, all of which have
     * been observed on MariaDB 10.4 in practice:
     *
     *  1. foreign keys that point at the outgoing columns,
     *  2. MariaDB refusing to drop a column that a UNIQUE index still
     *     contains (error 1072 — it does not trim the index first), while
     *     ordinary indexes are trimmed automatically, and
     *  3. InnoDB refusing to drop an index a foreign key depends on
     *     (error 1553) — unless another suitable index already exists.
     *
     * @param  list<string>  $columns
     */
    private function dropColumnsOnMysql(string $table, array $columns): void
    {
        // 1. Constraints that directly reference the outgoing columns.
        $referencing = array_values(array_filter(
            Schema::getForeignKeys($table),
            fn (array $foreignKey): bool => array_intersect($foreignKey['columns'], $columns) !== []
        ));

        if ($referencing !== []) {
            Schema::table($table, function (Blueprint $blueprint) use ($referencing): void {
                foreach ($referencing as $foreignKey) {
                    $blueprint->dropForeign($foreignKey['name']);
                }
            });
        }

        // 2. Unique indexes covering an outgoing column have to go as well.
        //    Fresh installs no longer create them — the columns they cover
        //    are removed for good — so nothing is rebuilt afterwards.
        foreach (Schema::getIndexes($table) as $index) {
            if (! $index['unique'] || array_intersect($index['columns'], $columns) === []) {
                continue;
            }

            // InnoDB will not drop the index a foreign key depends on unless
            // it can rebind that key elsewhere first. Hand every such foreign
            // key a dedicated index — named the way Laravel's own
            // `foreignId()->constrained()` convention names it — so the drop
            // is allowed to proceed.
            foreach (Schema::getForeignKeys($table) as $foreignKey) {
                if ($foreignKey['columns'] !== array_slice($index['columns'], 0, count($foreignKey['columns']))) {
                    continue;
                }

                $reusable = array_filter(
                    Schema::getIndexes($table),
                    fn (array $other): bool => $other['name'] !== $index['name']
                        && array_slice($other['columns'], 0, count($foreignKey['columns'])) === $foreignKey['columns']
                );

                if ($reusable !== []) {
                    continue;
                }

                Schema::table($table, function (Blueprint $blueprint) use ($table, $foreignKey): void {
                    $blueprint->index(
                        $foreignKey['columns'],
                        $table.'_'.implode('_', $foreignKey['columns']).'_foreign'
                    );
                });
            }

            Schema::table($table, function (Blueprint $blueprint) use ($index): void {
                $blueprint->dropUnique($index['name']);
            });
        }

        // 3. The columns themselves; the server trims ordinary indexes.
        Schema::table($table, function (Blueprint $blueprint) use ($columns): void {
            $blueprint->dropColumn($columns);
        });
    }

    /**
     * Rebuild a SQLite table without the given columns.
     *
     * SQLite cannot `DROP COLUMN` while a foreign key or index still refers to
     * the column, so the documented workaround is used: create a replacement
     * table, copy the surviving columns over, drop the original, then rename
     * the replacement into place and restore its indexes.
     *
     * @param  list<string>  $columns
     */
    private function dropColumnsOnSqlite(string $table, array $columns): void
    {
        $connection = DB::connection();

        $ddl = $connection->selectOne(
            "select sql from sqlite_master where type = 'table' and name = ?",
            [$table]
        )->sql ?? null;

        if ($ddl === null) {
            return;
        }

        $open = strpos($ddl, '(');
        $close = strrpos($ddl, ')');

        if ($open === false || $close === false) {
            return;
        }

        $keptItems = [];
        $keptColumns = [];

        foreach ($this->splitTopLevel(substr($ddl, $open + 1, $close - $open - 1)) as $item) {
            $item = trim($item);

            if ($item === '') {
                continue;
            }

            // Foreign key clause on one of the doomed columns.
            if (preg_match('/^foreign\s+key\s*\(\s*"?([A-Za-z0-9_]+)"?\s*\)/i', $item, $matches) === 1
                && in_array($matches[1], $columns, true)) {
                continue;
            }

            // Column definition of one of the doomed columns.
            if (preg_match('/^"([A-Za-z0-9_]+)"\s+\S/', $item, $matches) === 1) {
                if (in_array($matches[1], $columns, true)) {
                    continue;
                }

                $keptColumns[] = $matches[1];
            }

            $keptItems[] = $item;
        }

        if ($keptColumns === []) {
            return;
        }

        $indexes = $connection->select(
            "select sql from sqlite_master where type = 'index' and tbl_name = ? and sql is not null",
            [$table]
        );

        $temporary = '__remove_ns_'.$table;
        $columnList = implode(', ', array_map(fn (string $column): string => '"'.$column.'"', $keptColumns));

        // This pragma is ignored inside a transaction; migrations are not
        // wrapped in one on SQLite, so it takes effect here.
        DB::statement('pragma foreign_keys = off');

        DB::statement('drop table if exists "'.$temporary.'"');
        DB::statement('create table "'.$temporary.'" ('.implode(', ', $keptItems).')');
        DB::statement('insert into "'.$temporary.'" ('.$columnList.') select '.$columnList.' from "'.$table.'"');
        DB::statement('drop table "'.$table.'"');
        DB::statement('alter table "'.$temporary.'" rename to "'.$table.'"');

        foreach ($indexes as $index) {
            if (! $this->referencesAnyColumn($index->sql, $columns)) {
                DB::statement($index->sql);
            }
        }

        DB::statement('pragma foreign_keys = on');
    }

    /**
     * Split a table definition body on its top-level commas — commas inside
     * parentheses (`check (...)`, `default (...)`, `references x(id)`) or
     * string literals do not end an item.
     *
     * @return list<string>
     */
    private function splitTopLevel(string $body): array
    {
        $parts = [];
        $current = '';
        $depth = 0;
        $inString = false;

        for ($i = 0, $length = strlen($body); $i < $length; $i++) {
            $character = $body[$i];

            if ($inString) {
                $current .= $character;
                $inString = $character !== "'";

                continue;
            }

            if ($character === "'") {
                $inString = true;
                $current .= $character;

                continue;
            }

            if ($character === '(') {
                $depth++;
            }

            if ($character === ')') {
                $depth--;
            }

            if ($character === ',' && $depth === 0) {
                $parts[] = $current;
                $current = '';

                continue;
            }

            $current .= $character;
        }

        if (trim($current) !== '') {
            $parts[] = $current;
        }

        return $parts;
    }

    /**
     * @param  list<string>  $columns
     */
    private function referencesAnyColumn(string $sql, array $columns): bool
    {
        foreach ($columns as $column) {
            if (str_contains($sql, '"'.$column.'"') || str_contains($sql, $column)) {
                return true;
            }
        }

        return false;
    }

    public function down(): void
    {
        // Irreversible: the removed modules and their data cannot be restored.
    }
};
