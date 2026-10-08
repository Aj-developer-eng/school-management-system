<?php

use App\Enums\PermissionEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * The class papers feature was wired into the permission system; create its
     * permission rows so they appear on the Roles & Permissions page. Existing
     * environments that already created them (e.g. via the seeder) are unaffected.
     */
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate(PermissionEnum::UploadClassPapers->value, 'web');
        Permission::findOrCreate(PermissionEnum::DownloadClassPapers->value, 'web');
        Permission::findOrCreate(PermissionEnum::DeleteClassPapers->value, 'web');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $names = [
            PermissionEnum::UploadClassPapers->value,
            PermissionEnum::DownloadClassPapers->value,
            PermissionEnum::DeleteClassPapers->value,
        ];

        foreach ($names as $name) {
            $permission = Permission::where('name', $name)->where('guard_name', 'web')->first();

            if ($permission) {
                DB::table('role_has_permissions')->where('permission_id', $permission->id)->delete();
                DB::table('model_has_permissions')->where('permission_id', $permission->id)->delete();
                $permission->delete();
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};