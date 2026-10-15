<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
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

    public function test_selecting_multiple_fee_structures_creates_one_invoice_per_structure(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.store'), [
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->tuitionStructure->id, $this->transportStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success', '2 invoices created successfully.');

        $invoices = $this->student->invoices()->orderBy('id')->get();

        $this->assertCount(2, $invoices);
        $this->assertSame(
            [$this->tuitionStructure->id, $this->transportStructure->id],
            array_map('intval', $invoices->pluck('fee_structure_id')->all()),
        );
        $this->assertSame(
            [5000.0, 1500.0],
            $invoices->pluck('total_amount')->map(fn ($amount): float => (float) $amount)->all(),
        );
        // Each invoice gets its own unique invoice number.
        $this->assertNotSame($invoices[0]->invoice_number, $invoices[1]->invoice_number);
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
