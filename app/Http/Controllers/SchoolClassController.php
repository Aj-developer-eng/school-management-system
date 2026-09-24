<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolClass\StoreRequest;
use App\Http\Requests\SchoolClass\UpdateRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SchoolClass::class, 'school_class');
    }

    public function index(Request $request): Response
    {
        $activeSessionId = AcademicSession::active()->value('id');

        $classes = SchoolClass::query()
            ->with('activeFromSession')
            ->select('school_classes.*')
            ->selectRaw('(select count(distinct se.student_id)
                from student_enrollments se
                where se.school_class_id = school_classes.id
                    and se.deleted_at is null'
                    .($activeSessionId ? ' and se.academic_session_id = '.(int) $activeSessionId : '')
                    .') as students_count')
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('level')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Load the student lists for the classes on this page so the Students
        // badge can open a detail modal.
        $pageClassIds = $classes->getCollection()->pluck('id');

        $studentsByClass = $pageClassIds->isNotEmpty()
            ? DB::table('student_enrollments as se')
                ->join('students as st', 'st.id', '=', 'se.student_id')
                ->join('users as u', 'u.id', '=', 'st.user_id')
                ->leftJoin('sections as sec', 'sec.id', '=', 'se.section_id')
                ->whereIn('se.school_class_id', $pageClassIds)
                ->whereNull('se.deleted_at')
                ->whereNull('st.deleted_at')
                ->when($activeSessionId, function ($q) use ($activeSessionId): void {
                    $q->where('se.academic_session_id', $activeSessionId);
                })
                ->groupBy('se.school_class_id', 'st.id', 'u.name', 'st.admission_number', 'sec.name')
                ->orderBy('u.name')
                ->get([
                    'se.school_class_id',
                    'st.id as student_id',
                    'u.name as student_name',
                    'st.admission_number',
                    'sec.name as section_name',
                ])
                ->groupBy('school_class_id')
            : collect();

        $classes->getCollection()->each(function (SchoolClass $class) use ($studentsByClass): void {
            $class->students_list = $studentsByClass->get($class->id, collect())->values();
        });

        return Inertia::render('Academic/Class/Index', [
            'classes' => $classes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function store(StoreRequest $request): \Illuminate\Http\RedirectResponse
    {
        SchoolClass::create($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class created successfully.');
    }

    public function edit(SchoolClass $schoolClass): Response
    {
        return Inertia::render('Academic/Class/Form', [
            'class' => $schoolClass,
            'sessions' => AcademicSession::orderByDesc('start_date')->pluck('name', 'id'),
        ]);
    }

    public function update(UpdateRequest $request, SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->update($request->validated());

        return redirect()->route('classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass): \Illuminate\Http\RedirectResponse
    {
        $schoolClass->delete();

        return redirect()->route('classes.index')
            ->with('success', 'Class deleted successfully.');
    }
}
