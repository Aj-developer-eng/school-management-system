<?php

namespace App\Http\Controllers;

use App\Http\Requests\Parent\StoreRequest;
use App\Http\Requests\Parent\UpdateRequest;
use App\Models\Student;
use App\Models\StudentParent;
use App\Services\StudentParentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentParentController extends Controller
{
    public function __construct(private readonly StudentParentService $parents) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', StudentParent::class);

        $query = StudentParent::query()->with(['user', 'students.user']);

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request): void {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            })
                ->orWhere('cnic', 'like', "%{$request->search}%");
        }

        $parents = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Parent/Index', [
            'parents' => $parents,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', StudentParent::class);

        return $this->renderForm();
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        $this->parents->create($request->validated());

        return redirect()->route('parents.index')
            ->with('success', 'Parent added successfully.');
    }

    public function edit(StudentParent $parent): Response
    {
        $this->authorize('update', $parent);
        $parent->load(['user', 'students.user']);

        return $this->renderForm($parent);
    }

    public function update(UpdateRequest $request, StudentParent $parent): \Illuminate\Http\RedirectResponse
    {
        $this->parents->update($parent, $request->validated());

        return redirect()->route('parents.index')
            ->with('success', 'Parent updated successfully.');
    }

    public function destroy(StudentParent $parent): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $parent);
        $parent->delete();
        $parent->user->update(['is_active' => false]);

        return redirect()->route('parents.index')
            ->with('success', 'Parent deleted successfully.');
    }

    private function renderForm(?StudentParent $parent = null): Response
    {
        $existingStudents = $parent?->students->map(fn (Student $student) => [
            'student_id' => $student->id,
            'guardian_type' => $student->pivot->guardian_type,
            'is_primary_contact' => $student->pivot->is_primary_contact,
        ])->all() ?? [];

        return Inertia::render('Parent/Form', [
            'parent' => $parent ? [
                'id' => $parent->id,
                'user' => $parent->user,
                'occupation' => $parent->occupation,
                'cnic' => $parent->cnic,
                'emergency_contact' => $parent->emergency_contact,
                'address' => $parent->address,
                'is_active' => $parent->is_active,
                'students' => $existingStudents,
            ] : null,
            'students' => Student::with('user')->where('is_active', true)->orderBy('admission_number')->get()
                ->map(fn (Student $student) => ['id' => $student->id, 'label' => $student->admission_number.' — '.$student->user->name]),
        ]);
    }
}
