<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicSessionBulkActivationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        // VicePrincipal has ViewAcademicSessions but not UpdateAcademicSessions.
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole(Role::findOrCreate(RoleEnum::VicePrincipal->value, 'web'));
    }

    private function makeSession(string $name, bool $active = false): AcademicSession
    {
        return AcademicSession::create([
            'name' => $name,
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_active' => $active,
        ]);
    }

    public function test_bulk_activation_marks_multiple_sessions_active_at_once(): void
    {
        $a = $this->makeSession('2025-2026');
        $b = $this->makeSession('2026-2027');
        $c = $this->makeSession('2027-2028');

        $this->actingAs($this->admin)
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [$a->id, $b->id],
                'action' => 'activate',
            ])
            ->assertRedirect(route('academic-sessions.index'))
            ->assertSessionHas('success');

        $this->assertTrue($a->fresh()->is_active);
        $this->assertTrue($b->fresh()->is_active);
        $this->assertFalse($c->fresh()->is_active);
        $this->assertSame(2, AcademicSession::active()->count());
    }

    public function test_bulk_deactivation_marks_selected_sessions_inactive(): void
    {
        $a = $this->makeSession('2025-2026', true);
        $b = $this->makeSession('2026-2027', true);
        $c = $this->makeSession('2027-2028', true);

        $this->actingAs($this->admin)
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [$a->id, $b->id],
                'action' => 'deactivate',
            ])
            ->assertRedirect(route('academic-sessions.index'));

        $this->assertFalse($a->fresh()->is_active);
        $this->assertFalse($b->fresh()->is_active);
        $this->assertTrue($c->fresh()->is_active);
    }

    /**
     * The model boot hook that used to deactivate every other active session
     * on save is gone — two sessions saved active must both stay active.
     */
    public function test_saving_an_active_session_no_longer_deactivates_the_others(): void
    {
        $this->makeSession('2025-2026', true);
        $this->makeSession('2026-2027', true);

        $this->assertSame(2, AcademicSession::active()->count());
    }

    public function test_bulk_activation_requires_the_update_permission(): void
    {
        $session = $this->makeSession('2026-2027');

        $this->actingAs($this->viewer)
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [$session->id],
                'action' => 'activate',
            ])
            ->assertForbidden();

        $this->assertFalse($session->fresh()->is_active);
    }

    public function test_bulk_activation_requires_at_least_one_id(): void
    {
        $this->actingAs($this->admin)
            ->from(route('academic-sessions.index'))
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [],
                'action' => 'activate',
            ])
            ->assertRedirect(route('academic-sessions.index'))
            ->assertSessionHasErrors('ids');
    }

    public function test_bulk_activation_rejects_an_unknown_action(): void
    {
        $session = $this->makeSession('2026-2027');

        $this->actingAs($this->admin)
            ->from(route('academic-sessions.index'))
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [$session->id],
                'action' => 'toggle',
            ])
            ->assertRedirect(route('academic-sessions.index'))
            ->assertSessionHasErrors('action');

        $this->assertFalse($session->fresh()->is_active);
    }

    public function test_bulk_activation_rejects_unknown_session_ids(): void
    {
        $this->actingAs($this->admin)
            ->from(route('academic-sessions.index'))
            ->patch(route('academic-sessions.bulk-activation'), [
                'ids' => [999999],
                'action' => 'activate',
            ])
            ->assertRedirect(route('academic-sessions.index'))
            ->assertSessionHasErrors('ids.0');
    }
}
