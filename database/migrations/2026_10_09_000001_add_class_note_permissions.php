<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * The class notes feature was wired into the permission system; create its
     * permission rows so they appear on the Roles & Permissions page and grant
     * them to the roles the seeder would grant them to (existing environments
     * do not re-run the seeder). Super Admin is covered via Gate::before.
     */
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate(PermissionEnum::CreateClassNotes->value, 'web');
        Permission::findOrCreate(PermissionEnum::ViewClassNotes->value, 'web');

        $this->grantToRole(RoleEnum::Principal, [
            PermissionEnum::CreateClassNotes->value,
            PermissionEnum::ViewClassNotes->value,
        ]);
        $this->grantToRole(RoleEnum::Parent, [
            PermissionEnum::ViewClassNotes->value,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $names = [
            PermissionEnum::CreateClassNotes->value,
            PermissionEnum::ViewClassNotes->value,
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

    /**
     * @param  list<string>  $permissions
     */
    private function grantToRole(RoleEnum $roleEnum, array $permissions): void
    {
        $role = Role::where('name', $roleEnum->value)->where('guard_name', 'web')->first();

        if ($role) {
            $role->givePermissionTo($permissions);
        }
    }
};
