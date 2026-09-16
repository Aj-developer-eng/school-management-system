<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\Teacher;
use App\Models\TeacherAssignmentLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TeacherReportController extends Controller
{
    public function index(Request $request): Response
    {
        $fromDate = $request->input('from_date', now()->startOfMonth()->toDateString());
        $toDate = $request->input('to_date', now()->endOfMonth()->toDateString());
        $teacherId = $request->input('teacher_id');

        // Teachers can only view their own assignment logs; other permitted
        // staff (Super Admin, Principal, Vice Principal) see everyone.
        $scopedTeacher = $this->scopedTeacher($request->user());
        if ($scopedTeacher !== null) {
            $teacherId = $scopedTeacher->id;
        }

        $query = TeacherAssignmentLog::query()
            ->with(['teacher.user:id,name', 'schoolClass:id,name', 'section:id,name', 'subject:id,name'])
            ->whereBetween('log_date', [$fromDate, $toDate])
            ->when($teacherId, function ($q) use ($teacherId): void {
                $q->where('teacher_id', $teacherId);
            });

        $logs = (clone $query)
            ->orderBy('log_date')
            ->orderBy('occurred_at')
            ->get();

        // Per-teacher summary
        $teacherSummary = (clone $query)
            ->join('teachers', 'teacher_assignment_logs.teacher_id', '=', 'teachers.id')
            ->join('users', 'teachers.user_id', '=', 'users.id')
            ->select(
                'users.name as teacher_name',
                'teacher_assignment_logs.teacher_id',
                DB::raw('count(*) as total_events'),
                DB::raw("sum(case when action = 'started' then 1 else 0 end) as started_count"),
                DB::raw("sum(case when action = 'completed' then 1 else 0 end) as completed_count"),
                DB::raw("sum(case when action = 'reset' then 1 else 0 end) as reset_count"),
                DB::raw('count(distinct log_date) as active_days')
            )
            ->groupBy('teacher_assignment_logs.teacher_id', 'users.name')
            ->orderBy('users.name')
            ->get();

        // Per-date summary
        $dateSummary = (clone $query)
            ->select(
                'log_date',
                DB::raw("sum(case when action = 'started' then 1 else 0 end) as started_count"),
                DB::raw("sum(case when action = 'completed' then 1 else 0 end) as completed_count"),
                DB::raw("sum(case when action = 'reset' then 1 else 0 end) as reset_count"),
                DB::raw('count(distinct teacher_id) as active_teachers')
            )
            ->groupBy('log_date')
            ->orderBy('log_date')
            ->get();

        return Inertia::render('Teacher/Report/Index', [
            'logs' => $logs,
            'teacherSummary' => $teacherSummary,
            'dateSummary' => $dateSummary,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'teacher_id' => $teacherId,
            ],
            'teachers' => $scopedTeacher !== null
                ? [['id' => $scopedTeacher->id, 'name' => $scopedTeacher->user?->name ?? 'Me']]
                : Teacher::where('is_active', true)
                    ->with('user:id,name')
                    ->get()
                    ->map(fn ($t) => ['id' => $t->id, 'name' => $t->user->name])
                    ->all(),
            'isScoped' => $scopedTeacher !== null,
        ]);
    }

    /**
     * Return the Teacher record the current user is restricted to.
     * Teachers only see their own reports; other permitted roles see everything (null).
     */
    private function scopedTeacher(User $user): ?Teacher
    {
        if (! $user->hasRole(RoleEnum::Teacher->value)) {
            return null;
        }

        return Teacher::where('user_id', $user->id)->first();
    }
}
