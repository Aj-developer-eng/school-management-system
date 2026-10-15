<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\InvoiceStatusEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FeeInvoiceStoreTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private FeeStructure $tuitionStructure;

    private FeeStructure $transportStructure;

    private Student $student;

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

        $this->tuitionStructure = $this->makeFeeStructure('Tuition Fee', 5000);
        $this->transportStructure = $this->makeFeeStructure('Transport Fee', 1500);

        $user = User::factory()->create(['name' => 'Ali Khan']);
        $this->student = Student::create([
            'user_id' => $user->id,
            'admission_number' => 'ADM-001',
            'admission_date' => now()->toDateString(),
        ]);
    }

    public function test_selecting_multiple_fee_structures_creates_one_combined_invoice(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id, $this->transportStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');

        // Both structures are combined into a single invoice.
        $invoice = $this->student->invoices()->sole();

        $this->assertNull($invoice->fee_structure_id);
        $this->assertEqualsWithDelta(6500.0, (float) $invoice->total_amount, 0.01);
        $this->assertEqualsCanonicalizing(
            [$this->tuitionStructure->id, $this->transportStructure->id],
            $invoice->feeStructures->pluck('id')->all(),
        );
    }

    public function test_selecting_a_single_fee_structure_keeps_the_single_invoice_message(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');
        $this->assertCount(1, $this->student->invoices);
    }

    public function test_fee_structure_ids_is_required_and_duplicates_are_rejected(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('fee_structure_ids');

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id, $this->tuitionStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('fee_structure_ids.0');

        $this->assertSame(0, $this->student->invoices()->count());
    }

    public function test_invoice_for_sessionless_classless_structure_falls_back_to_active_session(): void
    {
        $structure = FeeStructure::create([
            'academic_session_id' => null,
            'school_class_id' => null,
            'name' => 'School-wide Fee',
            'fee_type' => FeeTypeEnum::Miscellaneous,
            'amount' => 900,
            'frequency' => FeeFrequencyEnum::OneTime,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$structure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->sole();

        // The student has no enrollment, so the active session is used and no
        // class is inherited from the structure.
        $this->assertEquals($this->session->id, $invoice->academic_session_id);
        $this->assertNull($invoice->school_class_id);
        $this->assertStringStartsWith("INV-{$this->session->id}-", (string) $invoice->invoice_number);
    }

    public function test_invoice_for_sessionless_structure_uses_the_students_enrollment(): void
    {
        $previousSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);

        StudentEnrollment::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $previousSession->id,
            'school_class_id' => $this->class->id,
        ]);

        $structure = FeeStructure::create([
            'academic_session_id' => null,
            'school_class_id' => null,
            'name' => 'School-wide Fee',
            'fee_type' => FeeTypeEnum::Miscellaneous,
            'amount' => 900,
            'frequency' => FeeFrequencyEnum::OneTime,
            'is_active' => true,
        ]);

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$structure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->sole();

        // The student's enrollment session (and class) fill the gaps.
        $this->assertEquals($previousSession->id, $invoice->academic_session_id);
        $this->assertEquals($this->class->id, $invoice->school_class_id);
        $this->assertStringStartsWith("INV-{$previousSession->id}-", (string) $invoice->invoice_number);
    }

    public function test_custom_amount_creates_an_invoice_without_any_fee_structure(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'custom_amount' => 2500.75,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->sole();

        $this->assertNull($invoice->fee_structure_id);
        $this->assertEqualsWithDelta(2500.75, (float) $invoice->total_amount, 0.01);
        $this->assertEqualsWithDelta(0.0, (float) $invoice->concession_amount, 0.01);
        $this->assertEquals(0, $invoice->feeStructures()->count());
        $this->assertEquals(InvoiceStatusEnum::Unpaid, $invoice->status);

        // No structure provides a session, and the student has no enrollment,
        // so the active session keys the invoice number series; no class is
        // known for the student.
        $this->assertEquals($this->session->id, $invoice->academic_session_id);
        $this->assertNull($invoice->school_class_id);
        $this->assertStringStartsWith("INV-{$this->session->id}-", (string) $invoice->invoice_number);
    }

    public function test_custom_amount_invoice_uses_the_students_enrollment_session_and_class(): void
    {
        StudentEnrollment::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
        ]);

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'custom_amount' => 750,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ])->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->sole();

        $this->assertNull($invoice->fee_structure_id);
        $this->assertEquals($this->session->id, $invoice->academic_session_id);
        $this->assertEquals($this->class->id, $invoice->school_class_id);
    }

    public function test_custom_amount_invoice_records_the_submitted_concession(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'custom_amount' => 2000,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'concession' => [
                'concession_type' => 'scholarship',
                'percentage' => 10,
                'reason' => 'One-off discount',
            ],
        ])->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->sole();

        $this->assertEqualsWithDelta(2000.0, (float) $invoice->total_amount, 0.01);
        $this->assertEqualsWithDelta(200.0, (float) $invoice->concession_amount, 0.01);
        $this->assertEqualsWithDelta(1800.0, (float) $invoice->balance, 0.01);

        // The concession row hangs off the invoice with no structure link.
        $concession = $invoice->concessions()->sole();
        $this->assertNull($concession->fee_structure_id);
        $this->assertEqualsWithDelta(10.0, (float) $concession->percentage, 0.01);
        $this->assertEquals($invoice->id, $concession->fee_invoice_id);
    }

    public function test_storing_requires_fee_structures_or_a_custom_amount(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('fee_structure_ids');

        $this->assertCount(0, $this->student->invoices);
    }

    public function test_storing_rejects_fee_structures_and_a_custom_amount_together(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id],
            'custom_amount' => 100,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('custom_amount');

        $this->assertCount(0, $this->student->invoices);
    }

    public function test_custom_amount_must_be_a_positive_number(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'custom_amount' => 0,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('custom_amount');

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'custom_amount' => 'free',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('custom_amount');

        $this->assertCount(0, $this->student->invoices);
    }

    private function makeFeeStructure(string $name, float $amount): FeeStructure
    {
        return FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => $name,
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => $amount,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}
