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
use App\Models\StudentEnrollment;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FeeInvoiceBulkGenerateTest extends TestCase
{
    use RefreshDatabase;

    private AcademicSession $session;

    private SchoolClass $classA;

    private SchoolClass $classB;

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

        $this->classA = $this->makeClass('Grade 1', 'G1', 1);
        $this->classB = $this->makeClass('Grade 2', 'G2', 2);
    }

    public function test_schoolwide_structure_generates_invoices_for_every_class_in_the_active_session(): void
    {
        // No session, no class → applies school-wide in the active session.
        $structure = $this->makeFeeStructure(null, null);
        $firstStudent = $this->makeEnrolledStudent('Student A', $this->classA);
        $secondStudent = $this->makeEnrolledStudent('Student B', $this->classB);

        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.bulk-generate'), [
            'fee_structure_id' => $structure->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertRedirect(route('fee-invoices.index'));
        $response->assertSessionHas('success');
        $this->assertSame(2, FeeInvoice::count());

        $invoiceA = $firstStudent->invoices()->sole();
        $invoiceB = $secondStudent->invoices()->sole();

        $this->assertEquals($this->session->id, $invoiceA->academic_session_id);
        $this->assertEquals($this->classA->id, $invoiceA->school_class_id);
        $this->assertEquals($this->session->id, $invoiceB->academic_session_id);
        $this->assertEquals($this->classB->id, $invoiceB->school_class_id);

        // A second run must not duplicate invoices for the same structure.
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.bulk-generate'), [
            'fee_structure_id' => $structure->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $this->assertSame(2, FeeInvoice::count());
    }

    public function test_structure_without_class_only_generates_for_students_in_its_session(): void
    {
        $otherSession = AcademicSession::create([
            'name' => '2025-2026',
            'start_date' => now()->subYear()->startOfYear(),
            'end_date' => now()->subYear()->endOfYear(),
            'is_active' => false,
        ]);

        $structure = $this->makeFeeStructure($this->session->id, null);

        $inSession = $this->makeEnrolledStudent('In session', $this->classA, $this->session);
        $otherStudent = $this->makeEnrolledStudent('Other session', $this->classA, $otherSession);

        $this->actingAs($this->makeSuperAdmin())->post(route('fee-invoices.bulk-generate'), [
            'fee_structure_id' => $structure->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $this->assertSame(1, FeeInvoice::count());
        $this->assertSame(0, $otherStudent->invoices()->count());
        $this->assertEquals($this->classA->id, $inSession->invoices()->sole()->school_class_id);
    }

    private function makeFeeStructure(?int $academicSessionId, ?int $schoolClassId): FeeStructure
    {
        return FeeStructure::create([
            'academic_session_id' => $academicSessionId,
            'school_class_id' => $schoolClassId,
            'name' => 'Assembly Fee',
            'fee_type' => FeeTypeEnum::Miscellaneous,
            'amount' => 300,
            'frequency' => FeeFrequencyEnum::OneTime,
            'is_active' => true,
        ]);
    }

    private function makeEnrolledStudent(string $name, SchoolClass $class, ?AcademicSession $session = null): Student
    {
        $user = User::factory()->create(['name' => $name]);
        $student = Student::create([
            'user_id' => $user->id,
            'admission_number' => 'ADM-'.uniqid(),
            'admission_date' => now()->toDateString(),
        ]);

        StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_session_id' => ($session ?? $this->session)->id,
            'school_class_id' => $class->id,
        ]);

        return $student;
    }

    private function makeClass(string $name, string $code, int $level): SchoolClass
    {
        return SchoolClass::create([
            'name' => $name,
            'code' => $code,
            'level' => $level,
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