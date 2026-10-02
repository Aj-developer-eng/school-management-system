<?php

namespace Tests\Feature;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\SectionCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SectionCategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private AcademicSession $session;

    private SchoolClass $class;

    protected function setUp(): void
    {
        parent::setUp();

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

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));
    }

    public function test_migration_seeds_the_default_categories(): void
    {
        $this->assertDatabaseHas('section_categories', ['name' => 'Science']);
        $this->assertDatabaseHas('section_categories', ['name' => 'Arts']);
        $this->assertDatabaseHas('section_categories', ['name' => 'Default']);
    }

    public function test_section_form_offers_the_categories(): void
    {
        $medical = SectionCategory::create(['name' => 'Medical', 'is_active' => true]);
        SectionCategory::create(['name' => 'Hidden stream', 'is_active' => false]);

        $activeCount = SectionCategory::where('is_active', true)->count();

        $this->actingAs($this->admin)
            ->get(route('sections.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Section/Form')
                ->has('categories', $activeCount)
                ->where('categories.'.$medical->id, 'Medical')
                ->missing('categories.'.SectionCategory::where('name', 'Hidden stream')->value('id'))
            );
    }

    public function test_a_category_can_be_created_inline(): void
    {
        $this->actingAs($this->admin)
            ->postJson(route('section-categories.store'), ['name' => 'Medical'])
            ->assertCreated()
            ->assertJsonPath('name', 'Medical')
            ->assertJsonPath('is_active', true);

        $this->assertDatabaseHas('section_categories', ['name' => 'Medical']);
    }

    public function test_creating_a_duplicate_category_is_rejected(): void
    {
        // "Science" is seeded by the migration.
        $this->actingAs($this->admin)
            ->postJson(route('section-categories.store'), ['name' => 'Science'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        $this->assertSame(1, SectionCategory::where('name', 'Science')->count());
    }

    public function test_a_category_name_is_required(): void
    {
        $this->actingAs($this->admin)
            ->postJson(route('section-categories.store'), ['name' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_a_section_can_be_created_with_a_category(): void
    {
        $category = SectionCategory::create(['name' => 'Medical', 'is_active' => true]);

        $this->actingAs($this->admin)
            ->post(route('sections.store'), [
                ...$this->sectionPayload(),
                'section_category_id' => $category->id,
            ])
            ->assertRedirect(route('sections.index'));

        $this->assertSame($category->id, Section::query()->latest('id')->value('section_category_id'));
    }

    public function test_a_section_can_be_created_without_a_category(): void
    {
        $this->actingAs($this->admin)
            ->post(route('sections.store'), $this->sectionPayload())
            ->assertRedirect(route('sections.index'));

        $this->assertNull(Section::query()->latest('id')->value('section_category_id'));
    }

    public function test_an_unknown_category_id_is_rejected(): void
    {
        $this->actingAs($this->admin)
            ->post(route('sections.store'), [
                ...$this->sectionPayload(),
                'section_category_id' => 99999,
            ])
            ->assertSessionHasErrors('section_category_id');

        $this->assertDatabaseCount('sections', 0);
    }

    public function test_the_index_lists_the_category_of_each_section(): void
    {
        $category = SectionCategory::create(['name' => 'Medical', 'is_active' => true]);

        Section::create([
            'name' => 'A',
            'section_category_id' => $category->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->actingAs($this->admin)
            ->get(route('sections.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('sections.data.0.category.name', 'Medical')
            );
    }

    public function test_deleting_a_category_keeps_its_sections(): void
    {
        $category = SectionCategory::create(['name' => 'Medical', 'is_active' => true]);

        $section = Section::create([
            'name' => 'A',
            'section_category_id' => $category->id,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
        ]);

        $this->actingAs($this->admin)
            ->delete(route('section-categories.destroy', $category))
            ->assertRedirect(route('sections.index'));

        $this->assertSoftDeleted('section_categories', ['id' => $category->id]);
        $this->assertNotNull($section->fresh());
        $this->assertNull($section->fresh()->section_category_id);
    }

    public function test_guests_cannot_create_a_category(): void
    {
        $this->postJson(route('section-categories.store'), ['name' => 'Science'])
            ->assertUnauthorized();
    }

    public function test_a_user_without_the_permission_cannot_create_a_category(): void
    {
        $user = User::factory()->create();
        $role = Role::findOrCreate('Receptionist', 'web');
        $role->givePermissionTo(Permission::findOrCreate(PermissionEnum::ViewSections->value, 'web'));
        $user->assignRole($role);

        $this->actingAs($user)
            ->postJson(route('section-categories.store'), ['name' => 'Medical'])
            ->assertForbidden();

        $this->assertDatabaseMissing('section_categories', ['name' => 'Medical']);
    }

    /**
     * @return array<string, mixed>
     */
    private function sectionPayload(): array
    {
        return [
            'name' => 'A',
            'capacity' => 30,
            'school_class_id' => $this->class->id,
            'academic_session_id' => $this->session->id,
            'room_number' => '101',
            'is_active' => true,
        ];
    }
}
