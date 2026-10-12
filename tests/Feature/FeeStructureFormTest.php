<?php

namespace Tests\Feature;

use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FeeStructureFormTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_create_form_lists_searchable_class_options(): void
    {
        $gradeFive = $this->makeClass('Grade 5', 'G5', 5);
        $gradeOne = $this->makeClass('Grade 1', 'G1', 1);
        $this->makeClass('Archived Class', 'ARCH', 9, false);

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-structures.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Fee/Structure/Form')
                // Options are { value, label, keywords } so the picker can filter
                // on the class code as well as the name shown in the label.
                // Ordered by level; inactive classes are omitted.
                ->has('classes', 2)
                ->where('classes.0.value', $gradeOne->id)
                ->where('classes.0.label', 'Grade 1 (G1)')
                ->where('classes.0.keywords', 'Grade 1 G1')
                ->where('classes.1.value', $gradeFive->id)
                ->where('classes.1.label', 'Grade 5 (G5)')
                ->where('classes.1.keywords', 'Grade 5 G5')
            );
    }

    public function test_edit_form_lists_searchable_class_options(): void
    {
        $class = $this->makeClass('Grade 5', 'G5', 5);

        $session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);

        $feeStructure = FeeStructure::create([
            'academic_session_id' => $session->id,
            'school_class_id' => $class->id,
            'name' => '2026-2027 Tuition Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 5000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('fee-structures.edit', $feeStructure))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Fee/Structure/Form')
                ->has('classes', 1)
                ->where('classes.0.value', $class->id)
                ->where('classes.0.label', 'Grade 5 (G5)')
                ->where('classes.0.keywords', 'Grade 5 G5')
            );
    }

    private function makeClass(string $name, string $code, int $level, bool $isActive = true): SchoolClass
    {
        return SchoolClass::create([
            'name' => $name,
            'code' => $code,
            'level' => $level,
            'is_active' => $isActive,
        ]);
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}