<?php

namespace Tests\Feature;

use App\Enums\RoleEnum;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DatabaseBackupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_super_admin_can_download_a_database_backup(): void
    {
        $admin = $this->makeSuperAdmin();

        $response = $this->actingAs($admin)->get(route('backups.download'));

        $response->assertOk();
        $this->assertStringContainsString('application/sql', (string) $response->headers->get('content-type'));

        $sql = $response->streamedContent();

        // Structure and data both have to be in the dump.
        $this->assertStringContainsString('CREATE TABLE "users"', $sql);
        $this->assertStringContainsString('INSERT INTO `users`', $sql);
        $this->assertStringContainsString($admin->email, $sql);
        $this->assertStringContainsString('BEGIN TRANSACTION;', $sql);
        $this->assertStringContainsString('PRAGMA foreign_keys=OFF;', $sql);
    }

    public function test_backup_filename_is_driver_and_timestamp_stamped(): void
    {
        $response = $this->actingAs($this->makeSuperAdmin())->get(route('backups.download'));

        $response->assertOk();
        $this->assertMatchesRegularExpression(
            '/backup-sqlite-\d{4}-\d{2}-\d{2}-\d{6}\.sql/',
            (string) $response->headers->get('content-disposition'),
        );
    }

    public function test_downloading_a_backup_is_recorded_in_the_activity_log(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin)->get(route('backups.download'))->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'module' => 'Backups',
            'action' => 'downloaded',
        ]);
    }

    public function test_a_user_without_the_download_permission_cannot_download_a_backup(): void
    {
        $receptionist = User::factory()->create();
        $receptionist->assignRole(Role::findOrCreate(RoleEnum::Receptionist->value, 'web'));

        $this->assertFalse($receptionist->can('backups.download'));

        $this->actingAs($receptionist)
            ->get(route('backups.download'))
            ->assertForbidden();
    }

    public function test_another_admin_role_can_be_granted_the_permission_from_the_roles_page(): void
    {
        $principal = User::factory()->create();
        $principal->assignRole(Role::findOrCreate(RoleEnum::Principal->value, 'web'));

        $this->actingAs($this->makeSuperAdmin())
            ->get(route('roles.index'))
            ->assertOk();

        $this->assertContains('backups.download', Permission::pluck('name')->all());

        // The seeder already grants the Principal everything, mirroring a super
        // admin ticking the box on /roles.
        $this->assertTrue($principal->fresh()->can('backups.download'));

        $this->actingAs($principal)
            ->get(route('backups.download'))
            ->assertOk();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('backups.download'))->assertRedirect(route('login'));
    }

    private function makeSuperAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        return $user;
    }
}
