<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FeeInvoicePrintTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private FeeStructure $feeStructure;

    private Student $student;

    private FeeInvoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => 'Grade 5',
            'code' => 'G5',
            'level' => 5,
            'is_active' => true,
        ]);

        $this->feeStructure = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Tuition Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 5000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $this->student = $this->makeStudent('ADM-001', 'Ali Khan');

        $this->invoice = FeeInvoice::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'fee_structure_id' => $this->feeStructure->id,
            'invoice_number' => 'INV-0001',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'total_amount' => 5000,
            'concession_amount' => 0,
            'paid_amount' => 1000,
        ]);
    }

    public function test_super_admin_can_print_an_invoice(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-invoices.print', $this->invoice));

        $response->assertOk();
        $response->assertSee('INV-0001');
        $response->assertSee('Ali Khan');
        // The on-screen toolbar drives the print dialog.
        $response->assertSee('window.print()', false);
    }

    public function test_print_page_still_downloads_as_a_pdf_without_the_toolbar(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-invoices.pdf', $this->invoice));

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
    }

    public function test_parent_can_print_their_own_childs_invoice(): void
    {
        $parent = $this->makeParent($this->student);
        $this->grantPrintPermission(RoleEnum::Parent->value);

        $this->actingAs($parent)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertOk()
            ->assertSee('INV-0001');
    }

    public function test_parent_cannot_print_without_the_print_permission(): void
    {
        $parent = $this->makeParent($this->student);

        $this->actingAs($parent)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertForbidden();
    }

    public function test_parent_cannot_print_another_familys_invoice(): void
    {
        $parent = $this->makeParent($this->makeStudent('ADM-002', 'Bilal Ahmed'));
        $this->grantPrintPermission(RoleEnum::Parent->value);

        $this->actingAs($parent)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertForbidden();
    }

    public function test_a_role_granted_the_print_permission_from_roles_can_print(): void
    {
        // Simulates a super admin ticking "fee-invoices.print" on /roles.
        $receptionist = User::factory()->create();
        $receptionist->assignRole(Role::findOrCreate(RoleEnum::Receptionist->value, 'web'));
        $this->grantPrintPermission(RoleEnum::Receptionist->value);

        $this->actingAs($receptionist)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertOk()
            ->assertSee('INV-0001');
    }

    public function test_a_role_without_the_print_permission_cannot_print(): void
    {
        $receptionist = User::factory()->create();
        $receptionist->assignRole(Role::findOrCreate(RoleEnum::Receptionist->value, 'web'));

        $this->actingAs($receptionist)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertForbidden();
    }

    public function test_viewing_an_invoice_does_not_imply_printing_it(): void
    {
        $receptionist = User::factory()->create();
        $receptionist->assignRole(Role::findOrCreate(RoleEnum::Receptionist->value, 'web'));

        // Receptionists have no fee access out of the box, so grant viewing only
        // to prove the print route does not ride on fee-invoices.view.
        Role::findByName(RoleEnum::Receptionist->value, 'web')->givePermissionTo('fee-invoices.view');
        $this->assertTrue($receptionist->fresh()->can('fee-invoices.view'));
        $this->assertFalse($receptionist->fresh()->can('fee-invoices.print'));

        $this->actingAs($receptionist)
            ->get(route('fee-invoices.pdf', $this->invoice))
            ->assertOk();

        $this->actingAs($receptionist)
            ->get(route('fee-invoices.print', $this->invoice))
            ->assertForbidden();
    }

    public function test_print_permission_is_offered_on_the_roles_page(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->get(route('roles.index'))
            ->assertOk();

        $permissions = Permission::orderBy('name')->pluck('name')->all();

        $this->assertContains('fee-invoices.print', $permissions);
    }

    public function test_invoice_index_is_reachable_for_super_admin(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-invoices.index'))
            ->assertOk();
    }

    public function test_invoice_create_form_lists_searchable_students(): void
    {
        $sara = $this->makeStudent('ADM-002', 'Sara Ahmed');

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-invoices.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Fee/Invoice/Form')
                ->has('students', 2)
                // Options are { value, label, keywords } so the picker can filter
                // on the student name as well as the admission number.
                ->where('students.0.value', $this->student->id)
                ->where('students.0.label', 'Ali Khan (ADM-001)')
                ->where('students.0.keywords', 'Ali Khan ADM-001')
                ->where('students.1.value', $sara->id)
                ->where('students.1.keywords', 'Sara Ahmed ADM-002')
            );
    }

public function test_invoice_create_form_omits_soft_deleted_students(): void
    {
        $this->student->delete();

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-invoices.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('students', 0));
    }

private function makeStudent(string $admissionNumber, string $name): Student
    {
        $user = User::factory()->create(['name' => $name]);

        return Student::create([
            'user_id' => $user->id,
            'admission_number' => $admissionNumber,
            'admission_date' => now()->toDateString(),
        ]);
    }

    private function makeParent(Student $student): User
    {
        $parentUser = User::factory()->create();
        $parentUser->assignRole(Role::findOrCreate(RoleEnum::Parent->value, 'web'));

        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'is_active' => true,
        ]);

        $parent->students()->attach($student->id, [
            'guardian_type' => 'Father',
            'is_primary_contact' => true,
        ]);

        return $parentUser;
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }

    /**
     * Grant the print permission to a role, exactly as a super admin ticking
     * the box on /roles and saving would.
     */
    private function grantPrintPermission(string $roleName): void
    {
        Role::findByName($roleName, 'web')->givePermissionTo('fee-invoices.print');
    }
}
