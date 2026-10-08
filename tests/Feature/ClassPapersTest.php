<?php

namespace Tests\Feature;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\ClassPaper;
use App\Models\SchoolClass;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClassPapersTest extends TestCase
{
    use RefreshDatabase;

    private SchoolClass $class;

    private User $superAdmin;

    private User $paperOfficer;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->class = SchoolClass::create([
            'name' => 'Grade 5',
            'code' => 'G5',
            'level' => 5,
            'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole(Role::findOrCreate(RoleEnum::SuperAdmin->value, 'web'));

        $officerRole = Role::findOrCreate('Paper Officer', 'web');
        $officerRole->syncPermissions([
            PermissionEnum::UploadClassPapers->value,
            PermissionEnum::DownloadClassPapers->value,
            PermissionEnum::DeleteClassPapers->value,
        ]);
        $this->paperOfficer = User::factory()->create();
        $this->paperOfficer->assignRole($officerRole);

        // The teacher can view classes but holds none of the papers permissions.
        $this->teacher = User::factory()->create();
        $this->teacher->assignRole(Role::findOrCreate(RoleEnum::Teacher->value, 'web'));
    }

    public function test_a_user_without_the_permission_cannot_upload_papers(): void
    {
        Storage::fake('local');

        $this->actingAs($this->teacher)
            ->post(route('classes.papers.store', $this->class->id), [
                'papers' => [self::pdfFile('exam.pdf')],
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('class_papers', 0);
    }

    public function test_papers_can_be_uploaded_for_a_class(): void
    {
        Storage::fake('local');

        $this->actingAs($this->paperOfficer)
            ->post(route('classes.papers.store', $this->class->id), [
                'papers' => [self::pdfFile('math.pdf'), self::pdfFile('science.pdf')],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('class_papers', 2);
        $this->assertCount(2, Storage::disk('local')->allFiles('class-papers'));

        $this->assertDatabaseHas('class_papers', [
            'school_class_id' => $this->class->id,
            'original_name' => 'math.pdf',
            'mime_type' => 'application/pdf',
            'created_by' => $this->paperOfficer->id,
        ]);
    }

    public function test_upload_rejects_files_that_are_not_pdf_or_word_documents(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->createWithContent('notes.txt', 'just some plain text');

        $this->actingAs($this->paperOfficer)
            ->post(route('classes.papers.store', $this->class->id), [
                'papers' => [$file],
            ])
            ->assertSessionHasErrors('papers.0');

        $this->assertDatabaseCount('class_papers', 0);
    }

    public function test_upload_requires_at_least_one_file(): void
    {
        Storage::fake('local');

        $this->actingAs($this->paperOfficer)
            ->post(route('classes.papers.store', $this->class->id), [])
            ->assertSessionHasErrors('papers');

        $this->assertDatabaseCount('class_papers', 0);
    }

    public function test_a_user_with_the_permission_can_download_a_paper(): void
    {
        Storage::fake('local');
        $paper = $this->makePaper();

        $this->actingAs($this->paperOfficer)
            ->get(route('classes.papers.download', $paper->id))
            ->assertDownload('exam.pdf');
    }

    public function test_a_user_without_the_permission_cannot_download_a_paper(): void
    {
        Storage::fake('local');
        $paper = $this->makePaper();

        $this->actingAs($this->teacher)
            ->get(route('classes.papers.download', $paper->id))
            ->assertForbidden();
    }

    public function test_a_paper_can_be_deleted_with_its_file(): void
    {
        Storage::fake('local');
        $paper = $this->makePaper();

        $this->actingAs($this->paperOfficer)
            ->delete(route('classes.papers.destroy', $paper->id))
            ->assertRedirect();

        $this->assertSoftDeleted('class_papers', ['id' => $paper->id]);
        Storage::disk('local')->assertMissing('class-papers/exam.pdf');
    }

    public function test_a_user_without_the_permission_cannot_delete_a_paper(): void
    {
        Storage::fake('local');
        $paper = $this->makePaper();

        $this->actingAs($this->teacher)
            ->delete(route('classes.papers.destroy', $paper->id))
            ->assertForbidden();

        $this->assertDatabaseHas('class_papers', ['id' => $paper->id, 'deleted_at' => null]);
        Storage::disk('local')->assertExists('class-papers/exam.pdf');
    }

    public function test_the_classes_index_exposes_the_uploaded_papers(): void
    {
        Storage::fake('local');
        $this->makePaper();

        $this->actingAs($this->superAdmin)
            ->get(route('classes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Academic/Class/Index')
                ->has('classes.data.0.papers', 1)
                ->where('classes.data.0.papers.0.original_name', 'exam.pdf')
            );
    }

    private function makePaper(): ClassPaper
    {
        // Storage::put() returns a bool — keep the relative path explicitly.
        $path = 'class-papers/exam.pdf';
        Storage::disk('local')->put($path, self::pdfContent());

        return $this->class->papers()->create([
            'file_path' => $path,
            'original_name' => 'exam.pdf',
            'mime_type' => 'application/pdf',
            'size' => strlen(self::pdfContent()),
        ]);
    }

    private static function pdfFile(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, self::pdfContent());
    }

    private static function pdfContent(): string
    {
        return "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\n";
    }
}