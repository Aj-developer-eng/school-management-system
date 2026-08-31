<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Academic Sessions
    case ViewAcademicSessions = 'academic-sessions.view';
    case CreateAcademicSessions = 'academic-sessions.create';
    case UpdateAcademicSessions = 'academic-sessions.update';
    case DeleteAcademicSessions = 'academic-sessions.delete';

    // Classes
    case ViewClasses = 'classes.view';
    case CreateClasses = 'classes.create';
    case UpdateClasses = 'classes.update';
    case DeleteClasses = 'classes.delete';

    // Sections
    case ViewSections = 'sections.view';
    case CreateSections = 'sections.create';
    case UpdateSections = 'sections.update';
    case DeleteSections = 'sections.delete';

    // Subjects
    case ViewSubjects = 'subjects.view';
    case CreateSubjects = 'subjects.create';
    case UpdateSubjects = 'subjects.update';
    case DeleteSubjects = 'subjects.delete';

    // Teachers
    case ViewTeachers = 'teachers.view';
    case CreateTeachers = 'teachers.create';
    case UpdateTeachers = 'teachers.update';
    case DeleteTeachers = 'teachers.delete';

    // Teacher Subject Assignments
    case ViewTeacherAssignments = 'teacher-assignments.view';
    case CreateTeacherAssignments = 'teacher-assignments.create';
    case UpdateTeacherAssignments = 'teacher-assignments.update';
    case DeleteTeacherAssignments = 'teacher-assignments.delete';

    // Students
    case ViewStudents = 'students.view';
    case CreateStudents = 'students.create';
    case UpdateStudents = 'students.update';
    case DeleteStudents = 'students.delete';

    // Parents
    case ViewParents = 'parents.view';
    case CreateParents = 'parents.create';
    case UpdateParents = 'parents.update';
    case DeleteParents = 'parents.delete';

    // School Settings
    case ViewSchoolSettings = 'school-settings.view';
    case UpdateSchoolSettings = 'school-settings.update';

    // User Management
    case ViewUsers = 'users.view';
    case CreateUsers = 'users.create';
    case UpdateUsers = 'users.update';
    case DeleteUsers = 'users.delete';

    // Roles & Permissions
    case ViewRoles = 'roles.view';
    case UpdateRoles = 'roles.update';

    // Fee Structures
    case ViewFeeStructures = 'fee-structures.view';
    case CreateFeeStructures = 'fee-structures.create';
    case UpdateFeeStructures = 'fee-structures.update';
    case DeleteFeeStructures = 'fee-structures.delete';

    // Fee Invoices
    case ViewFeeInvoices = 'fee-invoices.view';
    case CreateFeeInvoices = 'fee-invoices.create';
    case UpdateFeeInvoices = 'fee-invoices.update';
    case DeleteFeeInvoices = 'fee-invoices.delete';

    // Fee Payments
    case ViewFeePayments = 'fee-payments.view';
    case CreateFeePayments = 'fee-payments.create';
    case DeleteFeePayments = 'fee-payments.delete';

    // Fee Concessions
    case ViewFeeConcessions = 'fee-concessions.view';
    case CreateFeeConcessions = 'fee-concessions.create';
    case UpdateFeeConcessions = 'fee-concessions.update';
    case DeleteFeeConcessions = 'fee-concessions.delete';

    // Tests
    case ViewTests = 'tests.view';
    case CreateTests = 'tests.create';
    case UpdateTests = 'tests.update';
    case DeleteTests = 'tests.delete';
    case UploadTestResults = 'tests.upload-results';

    // Online Classes
    case ViewOnlineClasses = 'online-classes.view';
    case CreateOnlineClasses = 'online-classes.create';
    case UpdateOnlineClasses = 'online-classes.update';
    case DeleteOnlineClasses = 'online-classes.delete';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
