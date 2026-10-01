<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Builds a portable SQL dump of the database.
 *
 * The app runs on SQLite (see .env), where the simplest "copy" is the raw
 * database file — but that is useless on another machine or a MySQL
 * deployment. This produces plain SQL instead, so a backup restores anywhere:
 * structure first, then the data of every table.
 */
class DatabaseBackupService
{
    /**
     * Framework/queue plumbing rather than school data. Excluded to keep the
     * dump small and restorable.
     *
     * @var list<string>
     */
    private const EXCLUDED_TABLES = [
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
        'sessions',
    ];

    /**
     * Stream a full SQL dump of the current database as a file download.
     */
    public function download(): StreamedResponse
    {
        $filename = 'backup-'.$this->driverName().'-'.now()->format('Y-m-d-His').'.sql';

        return response()->streamDownload(function (): void {
            $this->writeDump();
        }, $filename, ['Content-Type' => 'application/sql']);
    }

    private function writeDump(): void
    {
        $out = fopen('php://output', 'wb');

        if ($out === false) {
            throw new RuntimeException('Unable to open the output stream for the backup.');
        }

        fwrite($out, $this->header());

        foreach ($this->tables() as $table) {
            $this->writeTableStructure($out, $table);
            $this->writeTableData($out, $table);
        }

        fwrite($out, "\n".($this->isSqlite() ? 'COMMIT;' : 'SET FOREIGN_KEY_CHECKS=1;')."\n\n-- End of backup\n");
        fclose($out);
    }

    private function header(): string
    {
        $lines = [
            '-- '.$this->driverName().' database backup',
            '-- Generated: '.now()->toDateTimeString(),
            '',
        ];

        if ($this->isSqlite()) {
            // Wrapped in a transaction and with foreign keys deferred, so a
            // restore either fully succeeds or fully rolls back.
            $lines[] = 'PRAGMA foreign_keys=OFF;';
            $lines[] = 'BEGIN TRANSACTION;';
        } else {
            $lines[] = 'SET FOREIGN_KEY_CHECKS=0;';
            $lines[] = 'SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";';
            $lines[] = 'SET CHARACTER SET utf8mb4;';
        }

        return implode("\n", $lines)."\n";
    }

    /**
     * Every user table that should be part of the backup.
     *
     * @return list<string>
     */
    private function tables(): array
    {
        $tables = $this->isSqlite()
            ? DB::select("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'")
            : DB::select('show tables');

        $names = [];

        foreach ($tables as $table) {
            $name = (string) (array_values((array) $table)[0] ?? '');

            if ($name !== '' && ! in_array($name, self::EXCLUDED_TABLES, true) && Schema::hasTable($name)) {
                $names[] = $name;
            }
        }

        return $names;
    }

    private function writeTableStructure($handle, string $table): void
    {
        fwrite($handle, "\n--\n-- Table: {$table}\n--\n");

        if ($this->isSqlite()) {
            $create = DB::select('select sql from sqlite_master where type = ? and name = ?', ['table', $table]);
        } else {
            $create = $this->mysqlCreateStatement($table);
        }

        $sql = $create === [] ? null : (string) ($create[0]->sql ?? '');

        if ($sql !== '') {
            fwrite($handle, rtrim($sql, ";\n\t ").";\n\n");
        }
    }

    private function writeTableData($handle, string $table): void
    {
        // Stream in primary-key order so the dump is stable and memory-bounded.
        DB::table($table)
            ->orderBy($this->primaryKey($table))
            ->chunk(200, function ($rows) use ($handle, $table): void {
                if ($rows->isEmpty()) {
                    return;
                }

                $columns = array_keys((array) $rows->first());
                $columnList = '`'.implode('`, `', $columns).'`';

                $values = $rows
                    ->map(fn ($row): string => '('.implode(', ', $this->quoteAll((array) $row, $columns)).')')
                    ->implode(",\n");

                fwrite($handle, "INSERT INTO `{$table}` ({$columnList}) VALUES\n{$values};\n");
            });
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<string>  $columns
     * @return list<string>
     */
    private function quoteAll(array $row, array $columns): array
    {
        return array_map(fn (string $column): string => $this->quote($row[$column] ?? null), $columns);
    }

    /**
     * Quote a single value for SQL.
     *
     * Quotes are doubled rather than backslash-escaped so the output stays
     * valid under both standard SQL and SQLite. Very long values are split
     * across CONCAT() so one oversized row can never break a parser's buffer.
     */
    private function quote(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        $value = (string) $value;

        if ($value === '') {
            return "''";
        }

        if (strlen($value) > 60000) {
            $chunks = array_map(
                fn (string $chunk): string => "'".str_replace("'", "''", $chunk)."'",
                str_split($value, 60000),
            );

            return 'CONCAT('.implode(', ', $chunks).')';
        }

        return "'".str_replace("'", "''", $value)."'";
    }

    private function primaryKey(string $table): string
    {
        foreach ($this->primaryKeyColumns($table) as $column) {
            if (Schema::hasColumn($table, $column)) {
                return $column;
            }
        }

        $columns = Schema::getColumnListing($table);

        return $columns[0] ?? 'id';
    }

    /**
     * Primary key columns, used to order the dump deterministically.
     *
     * @return list<string>
     */
    private function primaryKeyColumns(string $table): array
    {
        if (! $this->isSqlite()) {
            return array_values(array_filter(array_map(
                fn ($key): ?string => $key->Column_name ?? null,
                DB::select("show keys from `{$table}` where Key_name = 'PRIMARY'"),
            )));
        }

        $indexes = DB::select('select name, sql from sqlite_master where type = ? and tbl_name = ?', ['index', $table]);

        foreach ($indexes as $index) {
            $name = (string) $index->name;

            if (! str_contains($name, '_pkey') && ! str_contains($name, '_primary')) {
                continue;
            }

            if (preg_match('/\((.+)\)/', (string) $index->sql, $matches) === 1) {
                return array_map(fn (string $column): string => trim($column, '` "'), explode(',', $matches[1]));
            }
        }

        return [];
    }

    /**
     * @return list<object>
     */
    private function mysqlCreateStatement(string $table): array
    {
        $row = DB::select("show create table `{$table}`")[0] ?? null;

        if ($row === null) {
            return [];
        }

        $values = array_values((array) $row);

        return [(object) ['sql' => (string) end($values)]];
    }

    private function isSqlite(): bool
    {
        return $this->driverName() === 'sqlite';
    }

    private function driverName(): string
    {
        return DB::connection()->getDriverName();
    }
}
