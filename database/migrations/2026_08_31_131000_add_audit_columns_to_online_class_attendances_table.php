<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Columns already added in the table creation migration.
    }

    public function down(): void
    {
        // Columns are dropped when the table is dropped.
    }
};
