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

    public function test_store_saves_structure_without_session_or_class(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->post(route('fee-structures.store'), [
            'academic_session_id' => '',
            'school_class_id' => '',
            'name' => 'School-wide Activity Fee',
            'fee_type' => FeeTypeEnum::Miscellaneous->value,
            'amount' => 1200,
            'frequency' => FeeFrequencyEnum::OneTime->value,
            'is_active' => true,
        ]);

        $response->assertRedirect(route('fee-structures.index'));
        $response->assertSessionHas('success', 'Fee structure created successfully.');

        $structure = FeeStructure::sole();
        $this->assertNull($structure->academic_session_id);
        $this->assertNull($structure->school_class_id);
    }

    public function test_update_clears_session_and_class_when_left_blank(): void
    {
        $session = AcademicSession::create([
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => true,
        ]);
        $class = $this->makeClass('Grade 1', 'G1', 1);

        $structure = FeeStructure::create([
            'academic_session_id' => $session->id,
            'school_class_id' => $class->id,
            'name' => 'Tuition Fee',
            'fee_type' => FeeTypeEnum::Monthly,
            'amount' => 5000,
            'frequency' => FeeFrequencyEnum::Monthly,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->makeSuperAdmin())->put(route('fee-structures.update', $structure), [
            'academic_session_id' => '',
            'school_class_id' => '',
            'name' => 'Tuition Fee',
            'fee_type' => FeeTypeEnum::Monthly->value,
            'amount' => 5500,
            'frequency' => FeeFrequencyEnum::Monthly->value,
            'is_active' => true,
        ]);

        $response->assertRedirect(route('fee-structures.index'));
        $response->assertSessionHas('success', 'Fee structure updated successfully.');

        $structure->refresh();
        $this->assertNull($structure->academic_session_id);
        $this->assertNull($structure->school_class_id);
        $this->assertSame(5500.0, (float) $structure->amount);
    }

    public function test_store_still_rejects_unknown_session_or_class(): void
    {
        $this->actingAs($this->makeSuperAdmin())->post(route('fee-structures.store'), [
            'academic_session_id' => 9999,
            'school_class_id' => 9999,
            'name' => 'Invalid Fee',
            'fee_type' => FeeTypeEnum::Monthly->value,
            'amount' => 100,
            'frequency' => FeeFrequencyEnum::Monthly->value,
        ])->assertSessionHasErrors(['academic_session_id', 'school_class_id']);

        $this->assertSame(0, FeeStructure::count());
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