<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FeeInvoiceConcessionTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $class;

    private FeeStructure $feeStructure;

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

        $this->feeStructure = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Tuition Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 5000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $this->student = $this->makeStudent();
    }

    public function test_invoice_can_be_created_with_a_percentage_concession(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'scholarship',
                    'percentage' => '10',
                    'reason' => 'Merit scholarship',
                    'is_active' => true,
                ],
            ]));

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success');

        $invoice = FeeInvoice::sole();

        $this->assertDatabaseHas('fee_concessions', [
            'student_id' => $this->student->id,
            'fee_structure_id' => $this->feeStructure->id,
            'fee_invoice_id' => $invoice->id,
            'concession_type' => 'scholarship',
            'reason' => 'Merit scholarship',
            'is_active' => true,
        ]);

        // 10% of the Rs 5,000 structure amount.
        $this->assertEqualsWithDelta(500.0, (float) $invoice->concession_amount, 0.01);
        $this->assertEqualsWithDelta(4500.0, (float) $invoice->balance, 0.01);
    }

    public function test_invoice_can_be_created_with_a_flat_concession(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'sibling_discount',
                    'flat_amount' => '1200',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'));

        $invoice = FeeInvoice::sole();

        $this->assertDatabaseHas('fee_concessions', [
            'concession_type' => 'sibling_discount',
            'percentage' => null,
            'flat_amount' => 1200,
        ]);

        $this->assertEqualsWithDelta(1200.0, (float) $invoice->concession_amount, 0.01);
    }

    public function test_concession_is_capped_at_the_structure_amount(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'financial_aid',
                    'flat_amount' => '99999',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'));

        $invoice = FeeInvoice::sole();

        $this->assertEqualsWithDelta(5000.0, (float) $invoice->concession_amount, 0.01);
        $this->assertEqualsWithDelta(0.0, (float) $invoice->balance, 0.01);
    }

    public function test_concession_requires_a_percentage_or_flat_amount(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->from(route('fee-invoices.create'))
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'staff_child',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.create'))
            ->assertSessionHasErrors('concession.percentage');

        $this->assertDatabaseCount('fee_invoices', 0);
        $this->assertDatabaseCount('fee_concessions', 0);
    }

    public function test_percentage_and_flat_amount_cannot_both_be_sent(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'scholarship',
                    'percentage' => '10',
                    'flat_amount' => '500',
                    'is_active' => true,
                ],
            ]))
            ->assertSessionHasErrors('concession.percentage');

        $this->assertDatabaseCount('fee_invoices', 0);
    }

    public function test_user_without_concession_permission_cannot_attach_a_concession(): void
    {
        $this->actingAs($this->makeInvoiceOnlyUser())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'scholarship',
                    'percentage' => '10',
                    'is_active' => true,
                ],
            ]))
            ->assertSessionHasErrors('concession');

        $this->assertDatabaseCount('fee_invoices', 0);
        $this->assertDatabaseCount('fee_concessions', 0);
    }

    public function test_user_without_concession_permission_can_still_create_a_plain_invoice(): void
    {
        $this->actingAs($this->makeInvoiceOnlyUser())
            ->post(route('fee-invoices.store'), $this->validPayload())
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseCount('fee_invoices', 1);
        $this->assertDatabaseCount('fee_concessions', 0);

        $this->assertEqualsWithDelta(0.0, (float) FeeInvoice::sole()->concession_amount, 0.01);
    }

    public function test_invoice_can_be_created_without_a_concession(): void
    {
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload())
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $invoice = FeeInvoice::sole();

        $this->assertDatabaseCount('fee_concessions', 0);
        $this->assertEqualsWithDelta(0.0, (float) $invoice->concession_amount, 0.01);
        $this->assertEqualsWithDelta(5000.0, (float) $invoice->balance, 0.01);
    }

    public function test_existing_active_concessions_are_still_auto_applied_with_the_new_one(): void
    {
        // A student-level concession recorded earlier (not tied to an invoice).
        FeeConcession::create([
            'student_id' => $this->student->id,
            'fee_structure_id' => $this->feeStructure->id,
            'concession_type' => 'sibling_discount',
            'percentage' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'concession' => [
                    'concession_type' => 'scholarship',
                    'percentage' => '10',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'));

        $invoice = FeeInvoice::sole();

        // 5% auto-applied (Rs 250) + 10% from the form (Rs 500).
        $this->assertEqualsWithDelta(750.0, (float) $invoice->concession_amount, 0.01);
        $this->assertDatabaseCount('fee_concessions', 2);
    }

    public function test_invoice_can_be_created_for_multiple_fee_structures_without_a_concession(): void
    {
        // Regression: with several structures selected, the form used to
        // submit an empty `concession` object and fail validation with
        // "Either percentage or flat amount is required."
        $transport = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Transport Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 2000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'fee_structure_ids' => [$this->feeStructure->id, $transport->id],
            ]))
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseCount('fee_invoices', 2);
        $this->assertDatabaseCount('fee_concessions', 0);
    }

    public function test_concession_is_attached_to_each_invoice_when_multiple_structures_are_selected(): void
    {
        $transport = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Transport Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 2000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'fee_structure_ids' => [$this->feeStructure->id, $transport->id],
                'concession' => [
                    'concession_type' => 'scholarship',
                    'percentage' => '10',
                    'reason' => 'Merit scholarship',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseCount('fee_invoices', 2);
        $this->assertDatabaseCount('fee_concessions', 2);

        // 10% of Rs 5,000 and 10% of Rs 2,000.
        $tuition = FeeInvoice::where('fee_structure_id', $this->feeStructure->id)->sole();
        $bus = FeeInvoice::where('fee_structure_id', $transport->id)->sole();

        $this->assertEqualsWithDelta(500.0, (float) $tuition->concession_amount, 0.01);
        $this->assertEqualsWithDelta(200.0, (float) $bus->concession_amount, 0.01);
    }

    public function test_flat_concession_is_shared_once_across_multiple_structures(): void
    {
        $transport = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Transport Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 2000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        // Rs 1,200 total discount over a Rs 7,000 combined total: it is
        // consumed by the first invoice (Rs 5,000 structure) in full, and the
        // second invoice receives nothing — not Rs 1,200 twice.
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'fee_structure_ids' => [$this->feeStructure->id, $transport->id],
                'concession' => [
                    'concession_type' => 'sibling_discount',
                    'flat_amount' => '1200',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $tuition = FeeInvoice::where('fee_structure_id', $this->feeStructure->id)->sole();
        $bus = FeeInvoice::where('fee_structure_id', $transport->id)->sole();

        $this->assertEqualsWithDelta(1200.0, (float) $tuition->concession_amount, 0.01);
        $this->assertEqualsWithDelta(0.0, (float) $bus->concession_amount, 0.01);
        $this->assertEqualsWithDelta(3800.0, (float) $tuition->balance, 0.01);
        $this->assertEqualsWithDelta(2000.0, (float) $bus->balance, 0.01);
    }

    public function test_flat_concession_larger_than_first_structure_spills_into_the_next(): void
    {
        $transport = FeeStructure::create([
            'academic_session_id' => $this->session->id,
            'school_class_id' => $this->class->id,
            'name' => '2026-2027 Transport Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 2000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        // Rs 6,000 flat over Rs 5,000 + Rs 2,000: fully applied, capped at
        // the Rs 7,000 combined total (same cap the preview shows).
        $this->actingAs($this->makeSuperAdmin())
            ->post(route('fee-invoices.store'), $this->validPayload([
                'fee_structure_ids' => [$this->feeStructure->id, $transport->id],
                'concession' => [
                    'concession_type' => 'sibling_discount',
                    'flat_amount' => '6000',
                    'is_active' => true,
                ],
            ]))
            ->assertRedirect(route('fee-invoices.index'))
            ->assertSessionHas('success');

        $tuition = FeeInvoice::where('fee_structure_id', $this->feeStructure->id)->sole();
        $bus = FeeInvoice::where('fee_structure_id', $transport->id)->sole();

        $this->assertEqualsWithDelta(5000.0, (float) $tuition->concession_amount, 0.01);
        $this->assertEqualsWithDelta(1000.0, (float) $bus->concession_amount, 0.01);
        $this->assertDatabaseCount('fee_concessions', 2);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'student_id' => $this->student->id,
            'fee_structure_ids' => [$this->feeStructure->id],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ], $overrides);
    }

    private function makeStudent(): Student
    {
        $user = User::factory()->create(['name' => 'Ali Khan']);

        return Student::create([
            'user_id' => $user->id,
            'admission_number' => 'ADM-001',
            'admission_date' => now()->toDateString(),
        ]);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }

    /**
     * A clerk who may create invoices but not concessions.
     */
    private function makeInvoiceOnlyUser(): User
    {
        $role = Role::findOrCreate('Invoice Clerk', 'web');
        $role->givePermissionTo('fee-invoices.create');

        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }
}