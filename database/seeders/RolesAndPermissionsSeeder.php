<?php

namespace Database\Seeders;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::values() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (RoleEnum::values() as $role) {
            Role::findOrCreate($role, 'web');
        }

        // Super Admin is granted everything via Gate::before — no explicit permissions.
        $this->syncRolePermissions(RoleEnum::Principal, PermissionEnum::values());

        $feePermissions = [
            PermissionEnum::ViewFeeStructures->value,
            PermissionEnum::CreateFeeStructures->value,
            PermissionEnum::UpdateFeeStructures->value,
            PermissionEnum::DeleteFeeStructures->value,
            PermissionEnum::ViewFeeInvoices->value,
            PermissionEnum::CreateFeeInvoices->value,
            PermissionEnum::UpdateFeeInvoices->value,
            PermissionEnum::DeleteFeeInvoices->value,
            PermissionEnum::ViewFeePayments->value,
            PermissionEnum::CreateFeePayments->value,
            PermissionEnum::DeleteFeePayments->value,
            PermissionEnum::ViewFeeConcessions->value,
            PermissionEnum::CreateFeeConcessions->value,
            PermissionEnum::UpdateFeeConcessions->value,
            PermissionEnum::DeleteFeeConcessions->value,
        ];

        $this->syncRolePermissions(RoleEnum::VicePrincipal, [
            PermissionEnum::ViewAcademicSessions->value,
            PermissionEnum::ViewClasses->value,
            PermissionEnum::CreateClasses->value,
            PermissionEnum::UpdateClasses->value,
            PermissionEnum::DeleteClasses->value,
            PermissionEnum::ViewSections->value,
            PermissionEnum::CreateSections->value,
            PermissionEnum::UpdateSections->value,
            PermissionEnum::DeleteSections->value,
            PermissionEnum::ViewSubjects->value,
            PermissionEnum::CreateSubjects->value,
            PermissionEnum::UpdateSubjects->value,
            PermissionEnum::DeleteSubjects->value,
            PermissionEnum::ViewTeachers->value,
            PermissionEnum::CreateTeachers->value,
            PermissionEnum::UpdateTeachers->value,
            PermissionEnum::ViewTeacherAssignments->value,
            PermissionEnum::CreateTeacherAssignments->value,
            PermissionEnum::UpdateTeacherAssignments->value,
            PermissionEnum::DeleteTeacherAssignments->value,
            PermissionEnum::ViewStudents->value,
            PermissionEnum::CreateStudents->value,
            PermissionEnum::UpdateStudents->value,
            PermissionEnum::ViewParents->value,
            PermissionEnum::CreateParents->value,
            PermissionEnum::UpdateParents->value,
            PermissionEnum::ViewUsers->value,
            PermissionEnum::ViewFeeStructures->value,
            PermissionEnum::CreateFeeStructures->value,
            PermissionEnum::UpdateFeeStructures->value,
            PermissionEnum::ViewFeeInvoices->value,
            PermissionEnum::CreateFeeInvoices->value,
            PermissionEnum::UpdateFeeInvoices->value,
            PermissionEnum::ViewFeePayments->value,
            PermissionEnum::CreateFeePayments->value,
            PermissionEnum::ViewFeeConcessions->value,
            PermissionEnum::CreateFeeConcessions->value,
            PermissionEnum::UpdateFeeConcessions->value,
        ]);

        $this->syncRolePermissions(RoleEnum::Teacher, [
            PermissionEnum::ViewClasses->value,
            PermissionEnum::ViewSections->value,
            PermissionEnum::ViewSubjects->value,
            PermissionEnum::ViewTeacherAssignments->value,
            PermissionEnum::ViewStudents->value,
        ]);

        $this->syncRolePermissions(RoleEnum::Accountant, [
            PermissionEnum::ViewClasses->value,
            PermissionEnum::ViewSections->value,
            PermissionEnum::ViewStudents->value,
            PermissionEnum::ViewParents->value,
            PermissionEnum::ViewFeeStructures->value,
            PermissionEnum::CreateFeeStructures->value,
            PermissionEnum::UpdateFeeStructures->value,
            PermissionEnum::ViewFeeInvoices->value,
            PermissionEnum::CreateFeeInvoices->value,
            PermissionEnum::UpdateFeeInvoices->value,
            PermissionEnum::ViewFeePayments->value,
            PermissionEnum::CreateFeePayments->value,
            PermissionEnum::DeleteFeePayments->value,
            PermissionEnum::ViewFeeConcessions->value,
            PermissionEnum::CreateFeeConcessions->value,
            PermissionEnum::UpdateFeeConcessions->value,
        ]);

        $this->syncRolePermissions(RoleEnum::Receptionist, [
            PermissionEnum::ViewClasses->value,
            PermissionEnum::ViewSections->value,
            PermissionEnum::ViewStudents->value,
            PermissionEnum::CreateStudents->value,
            PermissionEnum::UpdateStudents->value,
            PermissionEnum::ViewParents->value,
            PermissionEnum::CreateParents->value,
            PermissionEnum::UpdateParents->value,
        ]);

        $this->syncRolePermissions(RoleEnum::Student, []);
        $this->syncRolePermissions(RoleEnum::Parent, []);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @param  list<string>  $permissions
     */
    private function syncRolePermissions(RoleEnum $role, array $permissions): void
    {
        Role::findByName($role->value, 'web')->syncPermissions($permissions);
    }
}
