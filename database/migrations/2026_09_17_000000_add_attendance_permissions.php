<?php

use App\Enums\PermissionEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * The attendance module was wired into the permission system; create its
     * permission rows so they appear on the Roles & Permissions page. Existing
     * environments that already created them (e.g. via the seeder) are unaffected.
     */
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate(PermissionEnum::ViewAttendances->value, 'web');
        Permission::findOrCreate(PermissionEnum::CreateAttendances->value, 'web');

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        foreach ([PermissionEnum::ViewAttendances->value, PermissionEnum::CreateAttendances->value] as $name) {
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
