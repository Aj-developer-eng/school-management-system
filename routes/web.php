<?php

use App\Http\Controllers\AcademicSessionController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeeConcessionController;
use App\Http\Controllers\FeeInvoiceController;
use App\Http\Controllers\FeePaymentController;
use App\Http\Controllers\FeeReportController;
use App\Http\Controllers\FeeStructureController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SpecialRequestController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentParentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherAssignmentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherReportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', LandingPageController::class)->name('landing');

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::patch('/dashboard/assignments/{assignment}/start', [DashboardController::class, 'startAssignment'])
        ->name('dashboard.assignments.start');
    Route::patch('/dashboard/assignments/{assignment}/complete', [DashboardController::class, 'completeAssignment'])
        ->name('dashboard.assignments.complete');
    Route::patch('/dashboard/assignments/{assignment}/reset', [DashboardController::class, 'resetAssignment'])
        ->name('dashboard.assignments.reset');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('academic-sessions', AcademicSessionController::class)
        ->except(['show'])
        ->names('academic-sessions');

    Route::resource('classes', SchoolClassController::class)
        ->except(['show'])
        ->parameters(['classes' => 'school_class'])
        ->names('classes');

    Route::resource('sections', SectionController::class)
        ->except(['show'])
        ->names('sections');

    Route::resource('subjects', SubjectController::class)
        ->except(['show'])
        ->names('subjects');

    Route::resource('teachers', TeacherController::class)
        ->except(['show'])
        ->names('teachers');

    Route::get('teacher-assignments/sections', [TeacherAssignmentController::class, 'filteredSections'])
        ->name('teacher-assignments.sections');
    Route::get('teacher-assignments/subjects', [TeacherAssignmentController::class, 'filteredSubjects'])
        ->name('teacher-assignments.subjects');

    Route::resource('teacher-assignments', TeacherAssignmentController::class)
        ->except(['show'])
        ->parameters(['teacher-assignments' => 'teacher_assignment'])
        ->names('teacher-assignments');

    Route::resource('students', StudentController::class)
       ->names('students');

    Route::patch('students/{student}/toggle-active', [StudentController::class, 'toggleActive'])
        ->name('students.toggle-active');
    Route::get('students/{student}/pdf', [StudentController::class, 'downloadPdf'])
        ->name('students.pdf');

    Route::resource('parents', StudentParentController::class)
        ->except(['show'])
        ->names('parents');

    Route::resource('users', UserController::class)
        ->except(['show'])
        ->names('users');

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'storeRole'])->name('roles.store');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroyRole'])->name('roles.destroy');
    Route::post('permissions', [RoleController::class, 'storePermission'])->name('permissions.store');

    Route::get('school-settings', [SchoolSettingController::class, 'edit'])
        ->name('school-settings.edit');
    Route::post('school-settings', [SchoolSettingController::class, 'update'])
        ->name('school-settings.update');

    Route::get('landing-page', [LandingPageController::class, 'edit'])
        ->name('landing-page.edit');
    Route::post('landing-page', [LandingPageController::class, 'update'])
        ->name('landing-page.update');

    Route::get('fee-reports', [FeeReportController::class, 'index'])
        ->name('fee-reports.index')
        ->middleware('can:fee-invoices.view');

    Route::get('teacher-reports', [TeacherReportController::class, 'index'])
        ->name('teacher-reports.index')
        ->middleware('can:teacher-assignments.view');

    Route::resource('fee-structures', FeeStructureController::class)
        ->except(['show'])
        ->parameters(['fee-structures' => 'fee_structure'])
        ->names('fee-structures');

    Route::post('fee-invoices/bulk-generate', [FeeInvoiceController::class, 'bulkGenerate'])
        ->name('fee-invoices.bulk-generate');
    Route::patch('fee-invoices/{fee_invoice}/cancel', [FeeInvoiceController::class, 'cancel'])
        ->name('fee-invoices.cancel');
    Route::get('fee-invoices/{fee_invoice}/pdf', [FeeInvoiceController::class, 'downloadPdf'])
        ->name('fee-invoices.pdf');
    Route::resource('fee-invoices', FeeInvoiceController::class)
        ->parameters(['fee-invoices' => 'fee_invoice'])
        ->names('fee-invoices');

    Route::get('fee-payments/create', [FeePaymentController::class, 'create'])
        ->name('fee-payments.create');
    Route::post('fee-payments', [FeePaymentController::class, 'store'])
        ->name('fee-payments.store');
    Route::delete('fee-payments/{fee_payment}', [FeePaymentController::class, 'destroy'])
        ->name('fee-payments.destroy');

    Route::resource('fee-concessions', FeeConcessionController::class)
        ->except(['show'])
        ->parameters(['fee-concessions' => 'fee_concession'])
        ->names('fee-concessions');

    Route::get('attendance', [AttendanceController::class, 'index'])
        ->name('attendance.index');
    Route::get('attendance/report', [AttendanceController::class, 'report'])
        ->name('attendance.report');
    Route::get('attendance/student/{student}', [AttendanceController::class, 'studentDetail'])
        ->name('attendance.student');
    Route::get('attendance/{assignment}', [AttendanceController::class, 'show'])
        ->name('attendance.show');
    Route::post('attendance/{assignment}', [AttendanceController::class, 'store'])
        ->name('attendance.store');

    Route::get('special-requests', [SpecialRequestController::class, 'index'])
        ->name('special-requests.index');
    Route::get('special-requests/create', [SpecialRequestController::class, 'create'])
        ->name('special-requests.create');
    Route::post('special-requests', [SpecialRequestController::class, 'store'])
        ->name('special-requests.store');
    Route::get('special-requests/{special_request}', [SpecialRequestController::class, 'show'])
        ->name('special-requests.show');
    Route::patch('special-requests/{special_request}/respond', [SpecialRequestController::class, 'respond'])
        ->name('special-requests.respond');

    Route::get('activity-logs', [ActivityLogController::class, 'index'])
        ->name('activity-logs.index');

    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
});

require __DIR__.'/auth.php';
