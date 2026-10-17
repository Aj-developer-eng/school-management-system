<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
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

        $invoices = $this->student->invoices()->orderBy('id')->get();

        // Only ONE combined invoice is created — not one per structure.
        $this->assertCount(1, $invoices);

        $invoice = $invoices->first();
        $this->assertNull($invoice->fee_structure_id);
        $this->assertSame(6500.0, (float) $invoice->total_amount);
        $this->assertSame(0.0, (float) $invoice->concession_amount);
        $this->assertSame(
            ['Tuition Fee', 'Transport Fee'],
            array_column($invoice->items, 'name'),
        );
        $this->assertSame(
            [5000.0, 1500.0],
            array_map('floatval', array_column($invoice->items, 'amount')),
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

        $invoice = $this->student->invoices->first();
        $this->assertCount(1, $this->student->invoices);
        // A single selection stays a regular structure-linked invoice.
        $this->assertSame($this->tuitionStructure->id, (int) $invoice->fee_structure_id);
        $this->assertNull($invoice->items);
    }

    public function test_at_least_one_fee_structure_or_custom_amount_is_required_and_duplicates_are_rejected(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors([
            'fee_structure_ids' => 'Select at least one fee structure or enter a custom amount.',
        ]);

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id, $this->tuitionStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ])->assertSessionHasErrors('fee_structure_ids.0');

        $this->assertSame(0, $this->student->invoices()->count());
    }

    public function test_custom_amount_without_fee_structure_creates_one_invoice(): void
    {
        StudentEnrollment::create([
            'student_id' => $this->student->id,
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'enrolled_on' => now()->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [],
            'custom_amount' => 750.50,
            'custom_label' => 'Lab Breakage Charge',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->first();
        $this->assertCount(1, $this->student->invoices);
        // The invoice belongs to the student's enrollment session/class.
        $this->assertNull($invoice->fee_structure_id);
        $this->assertSame($this->session->id, (int) $invoice->academic_session_id);
        $this->assertSame($this->class->id, (int) $invoice->school_class_id);
        $this->assertSame(750.5, (float) $invoice->total_amount);
        $this->assertCount(1, $invoice->items);
        $this->assertSame('Lab Breakage Charge', $invoice->items[0]['name']);
        $this->assertSame(750.5, (float) $invoice->items[0]['amount']);
    }

    public function test_custom_amount_is_added_to_selected_fee_structures(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id, $this->transportStructure->id],
            'custom_amount' => 500,
            'custom_label' => 'Late Exam Fee',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', 'Invoice created successfully.');

        $invoice = $this->student->invoices()->first();
        $this->assertCount(1, $this->student->invoices);
        $this->assertNull($invoice->fee_structure_id);
        $this->assertSame(7000.0, (float) $invoice->total_amount);
        $this->assertSame(
            ['Tuition Fee', 'Transport Fee', 'Late Exam Fee'],
            array_column($invoice->items, 'name'),
        );
        $this->assertSame(
            [5000.0, 1500.0, 500.0],
            array_map('floatval', array_column($invoice->items, 'amount')),
        );
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
