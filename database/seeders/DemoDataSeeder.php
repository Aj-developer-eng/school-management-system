<?php

namespace Database\Seeders;

use App\Enums\ConcessionTypeEnum;
use App\Enums\FeeFrequencyEnum;
use App\Enums\FeeTypeEnum;
use App\Enums\InvoiceStatusEnum;
use App\Enums\PaymentMethodEnum;
use App\Enums\RoleEnum;
use App\Models\AcademicSession;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubjectAssignment;
use App\Models\User;
use App\Services\FeeInvoiceService;
use App\Services\FeePaymentService;
use App\Services\StudentParentService;
use App\Services\StudentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedSchoolSettings();
        $this->seedAcademicData();
        $this->seedTeachers();
        $this->seedTeacherAssignments();
        $this->seedStudentsAndParents();
        $this->seedFees();
    }

    private function seedSchoolSettings(): void
    {
        SchoolSetting::updateOrCreate(
            ['id' => 1],
            [
                'school_name' => 'Pakistan Model School',
                'school_prefix' => 'PMS',
                'registration_number' => 'REG-2025-001',
                'affiliation' => 'Board of Intermediate & Secondary Education',
                'email' => 'info@pakistanmodelschool.edu',
                'phone' => '+92-300-1234567',
                'address' => '123 Main Road, Township',
                'city' => 'Lahore',
                'country' => 'Pakistan',
            ]
        );
    }

    private function seedAcademicData(): void
    {
        $session2025 = AcademicSession::updateOrCreate(
            ['name' => '2025-2026'],
            [
                'start_date' => '2025-04-01',
                'end_date' => '2026-03-31',
                'is_active' => true,
            ]
        );

        $session2024 = AcademicSession::updateOrCreate(
            ['name' => '2024-2025'],
            [
                'start_date' => '2024-04-01',
                'end_date' => '2025-03-31',
                'is_active' => false,
            ]
        );

        $classDefinitions = [
            ['name' => 'Playgroup', 'code' => 'PG', 'level' => 0],
            ['name' => 'Nursery', 'code' => 'NUR', 'level' => 1],
            ['name' => 'Prep', 'code' => 'PREP', 'level' => 2],
            ['name' => 'Class 1', 'code' => 'C1', 'level' => 3],
            ['name' => 'Class 2', 'code' => 'C2', 'level' => 4],
            ['name' => 'Class 3', 'code' => 'C3', 'level' => 5],
            ['name' => 'Class 4', 'code' => 'C4', 'level' => 6],
            ['name' => 'Class 5', 'code' => 'C5', 'level' => 7],
            ['name' => 'Class 6', 'code' => 'C6', 'level' => 8],
            ['name' => 'Class 7', 'code' => 'C7', 'level' => 9],
            ['name' => 'Class 8', 'code' => 'C8', 'level' => 10],
            ['name' => 'Class 9', 'code' => 'C9', 'level' => 11],
            ['name' => 'Class 10', 'code' => 'C10', 'level' => 12],
        ];

        $classes = [];
        foreach ($classDefinitions as $definition) {
            $classes[$definition['code']] = SchoolClass::updateOrCreate(
                ['code' => $definition['code']],
                [
                    'name' => $definition['name'],
                    'level' => $definition['level'],
                    'active_from_session_id' => $session2025->id,
                    'is_active' => true,
                ],
            );
        }

        foreach ($classes as $code => $class) {
            if (in_array($code, ['PG', 'NUR', 'PREP', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'])) {
                Section::updateOrCreate(
                    ['name' => 'A', 'school_class_id' => $class->id, 'academic_session_id' => $session2025->id],
                    ['capacity' => 30, 'room_number' => 'R'.$class->level.'A', 'is_active' => true],
                );
                Section::updateOrCreate(
                    ['name' => 'B', 'school_class_id' => $class->id, 'academic_session_id' => $session2025->id],
                    ['capacity' => 30, 'room_number' => 'R'.$class->level.'B', 'is_active' => true],
                );
            }
        }

        $subjectDefinitions = [
            ['name' => 'English', 'code' => 'ENG'],
            ['name' => 'Urdu', 'code' => 'URD'],
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Science', 'code' => 'SCI'],
            ['name' => 'Social Studies', 'code' => 'SST'],
            ['name' => 'Islamiat', 'code' => 'ISL'],
            ['name' => 'Computer Studies', 'code' => 'COMP'],
            ['name' => 'Physics', 'code' => 'PHY'],
            ['name' => 'Chemistry', 'code' => 'CHEM'],
            ['name' => 'Biology', 'code' => 'BIO'],
        ];

        $subjects = [];
        foreach ($subjectDefinitions as $subject) {
            $subjects[$subject['code']] = Subject::updateOrCreate(
                ['code' => $subject['code']],
                ['name' => $subject['name'], 'is_active' => true],
            );
        }

        $subjectMappings = [
            'ENG' => ['PG', 'NUR', 'PREP', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'URD' => ['PG', 'NUR', 'PREP', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'MATH' => ['PREP', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'SCI' => ['C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'SST' => ['C4', 'C5', 'C6', 'C7', 'C8'],
            'ISL' => ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'COMP' => ['C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
            'PHY' => ['C9', 'C10'],
            'CHEM' => ['C9', 'C10'],
            'BIO' => ['C9', 'C10'],
        ];

        foreach ($subjectMappings as $subjectCode => $classCodes) {
            $subject = $subjects[$subjectCode];
            $ids = collect($classCodes)
                ->map(fn ($code) => $classes[$code]->id ?? null)
                ->filter()
                ->all();

            $subject->schoolClasses()->sync($ids);
        }
    }

    private function seedTeachers(): void
    {
        $teacherData = [
            ['name' => 'Ahmed Khan', 'email' => 'ahmed.teacher@school.test', 'code' => 'TCH-001'],
            ['name' => 'Fatima Ali', 'email' => 'fatima.teacher@school.test', 'code' => 'TCH-002'],
            ['name' => 'Bilal Raza', 'email' => 'bilal.teacher@school.test', 'code' => 'TCH-003'],
            ['name' => 'Sana Tariq', 'email' => 'sana.teacher@school.test', 'code' => 'TCH-004'],
            ['name' => 'Usman Farooq', 'email' => 'usman.teacher@school.test', 'code' => 'TCH-005'],
        ];

        foreach ($teacherData as $index => $teacher) {
            $user = User::firstOrCreate(
                ['email' => $teacher['email']],
                [
                    'name' => $teacher['name'],
                    'phone' => '+92-300-'.str_pad($index + 1, 7, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );
            $user->syncRoles(RoleEnum::Teacher->value);

            Teacher::firstOrCreate(
                ['employee_code' => $teacher['code']],
                [
                    'user_id' => $user->id,
                    'qualification' => 'B.Ed, '.['Mathematics', 'English', 'Science', 'Urdu', 'Computer Science'][$index],
                    'joining_date' => now()->subYears(2)->toDateString(),
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedTeacherAssignments(): void
    {
        $session = AcademicSession::where('name', '2025-2026')->first();
        $classC1 = SchoolClass::where('code', 'C1')->first();
        $sectionA = Section::where('school_class_id', $classC1->id)
            ->where('academic_session_id', $session->id)
            ->where('name', 'A')
            ->first();

        $subjectEng = Subject::where('code', 'ENG')->first();
        $subjectMath = Subject::where('code', 'MATH')->first();
        $subjectSci = Subject::where('code', 'SCI')->first();
        $subjectUrd = Subject::where('code', 'URD')->first();

        $teachers = Teacher::orderBy('id')->get();

        $assignments = [
            ['teacher_index' => 0, 'subject' => $subjectEng],
            ['teacher_index' => 1, 'subject' => $subjectMath],
            ['teacher_index' => 2, 'subject' => $subjectSci],
            ['teacher_index' => 3, 'subject' => $subjectUrd],
        ];

        foreach ($assignments as $item) {
            $teacher = $teachers[$item['teacher_index']] ?? null;
            if ($teacher && $item['subject']) {
                TeacherSubjectAssignment::firstOrCreate(
                    [
                        'teacher_id' => $teacher->id,
                        'academic_session_id' => $session->id,
                        'school_class_id' => $classC1->id,
                        'section_id' => $sectionA->id,
                        'subject_id' => $item['subject']->id,
                    ],
                    [
                        'status' => 'pending',
                    ]
                );
            }
        }
    }

    private function seedStudentsAndParents(): void
    {
        $studentService = app(StudentService::class);
        $parentService = app(StudentParentService::class);

        $session = AcademicSession::where('name', '2025-2026')->first();
        $classC1 = SchoolClass::where('code', 'C1')->first();
        $sectionA = Section::where('school_class_id', $classC1->id)
            ->where('academic_session_id', $session->id)
            ->where('name', 'A')
            ->first();

        $studentData = [
            ['name' => 'Hamza Iqbal', 'dob' => '2015-05-12'],
            ['name' => 'Ayesha Iqbal', 'dob' => '2017-03-08'],
            ['name' => 'Hassan Raza', 'dob' => '2015-08-19'],
            ['name' => 'Zainab Raza', 'dob' => '2016-11-23'],
            ['name' => 'Ali Tariq', 'dob' => '2014-12-01'],
        ];

        $students = [];
        foreach ($studentData as $data) {
            $students[] = $studentService->create([
                'name' => $data['name'],
                'admission_date' => '2025-04-01',
                'date_of_birth' => $data['dob'],
                'gender' => 'male',
                'nationality' => 'Pakistani',
                'academic_session_id' => $session->id,
                'school_class_id' => $classC1->id,
                'section_id' => $sectionA->id,
                'enrolled_on' => '2025-04-01',
            ]);
        }

        $parentData = [
            [
                'name' => 'Iqbal Hussain',
                'email' => 'iqbal.parent@school.test',
                'password' => 'password',
                'cnic' => '35202-1234567-1',
                'students' => [
                    ['student_id' => $students[0]->id, 'guardian_type' => 'Father', 'is_primary_contact' => true],
                    ['student_id' => $students[1]->id, 'guardian_type' => 'Father', 'is_primary_contact' => true],
                ],
            ],
            [
                'name' => 'Saima Iqbal',
                'email' => 'saima.parent@school.test',
                'password' => 'password',
                'cnic' => '35202-1234567-2',
                'students' => [
                    ['student_id' => $students[0]->id, 'guardian_type' => 'Mother', 'is_primary_contact' => false],
                    ['student_id' => $students[1]->id, 'guardian_type' => 'Mother', 'is_primary_contact' => false],
                ],
            ],
            [
                'name' => 'Raza Ahmed',
                'email' => 'raza.parent@school.test',
                'password' => 'password',
                'cnic' => '35202-1234568-1',
                'students' => [
                    ['student_id' => $students[2]->id, 'guardian_type' => 'Father', 'is_primary_contact' => true],
                    ['student_id' => $students[3]->id, 'guardian_type' => 'Father', 'is_primary_contact' => true],
                ],
            ],
            [
                'name' => 'Tariq Mehmood',
                'email' => 'tariq.parent@school.test',
                'password' => 'password',
                'cnic' => '35202-1234569-1',
                'students' => [
                    ['student_id' => $students[4]->id, 'guardian_type' => 'Guardian', 'is_primary_contact' => true],
                ],
            ],
        ];

        foreach ($parentData as $parent) {
            $parentService->create($parent);
        }
    }

    private function seedFees(): void
    {
        $session = AcademicSession::where('name', '2025-2026')->first();
        $classC1 = SchoolClass::where('code', 'C1')->first();

        $feeStructures = [
            [
                'name' => 'Admission Fee',
                'fee_type' => FeeTypeEnum::Admission,
                'amount' => 5000,
                'frequency' => FeeFrequencyEnum::OneTime,
            ],
            [
                'name' => 'Monthly Tuition Fee',
                'fee_type' => FeeTypeEnum::Monthly,
                'amount' => 2500,
                'frequency' => FeeFrequencyEnum::Monthly,
                'due_day' => 10,
            ],
            [
                'name' => 'Examination Fee',
                'fee_type' => FeeTypeEnum::Exam,
                'amount' => 1000,
                'frequency' => FeeFrequencyEnum::Quarterly,
            ],
            [
                'name' => 'Transport Fee',
                'fee_type' => FeeTypeEnum::Transport,
                'amount' => 1500,
                'frequency' => FeeFrequencyEnum::Monthly,
                'due_day' => 10,
            ],
        ];

        $structureIds = [];
        foreach ($feeStructures as $fs) {
            $structure = FeeStructure::firstOrCreate(
                [
                    'academic_session_id' => $session->id,
                    'school_class_id' => $classC1->id,
                    'name' => $fs['name'],
                ],
                array_merge($fs, [
                    'academic_session_id' => $session->id,
                    'school_class_id' => $classC1->id,
                    'is_active' => true,
                ])
            );
            $structureIds[] = $structure->id;
        }

        $students = Student::all();
        $invoiceService = app(FeeInvoiceService::class);
        $paymentService = app(FeePaymentService::class);

        $admissionStructure = FeeStructure::find($structureIds[0]);
        $monthlyStructure = FeeStructure::find($structureIds[1]);

        foreach ($students as $student) {
            $invoice = $invoiceService->createInvoice([
                'student_id' => $student->id,
                'fee_structure_id' => $admissionStructure->id,
                'issue_date' => '2025-04-01',
                'due_date' => '2025-04-15',
            ]);

            $paymentService->recordPayment([
                'fee_invoice_id' => $invoice->id,
                'amount' => $admissionStructure->amount,
                'payment_date' => '2025-04-05',
                'payment_method' => PaymentMethodEnum::Cash,
            ]);

            $monthlyInvoice = $invoiceService->createInvoice([
                'student_id' => $student->id,
                'fee_structure_id' => $monthlyStructure->id,
                'issue_date' => '2025-05-01',
                'due_date' => '2025-05-10',
            ]);

            if ($student->id % 2 === 0) {
                $paymentService->recordPayment([
                    'fee_invoice_id' => $monthlyInvoice->id,
                    'amount' => 1500,
                    'payment_date' => '2025-05-08',
                    'payment_method' => PaymentMethodEnum::BankTransfer,
                    'transaction_reference' => 'TRX-'.str_pad($student->id, 5, '0', STR_PAD_LEFT),
                ]);
            }
        }

        $firstStudent = Student::first();
        if ($firstStudent) {
            FeeConcession::firstOrCreate(
                [
                    'student_id' => $firstStudent->id,
                    'concession_type' => ConcessionTypeEnum::SiblingDiscount,
                ],
                [
                    'student_id' => $firstStudent->id,
                    'fee_structure_id' => null,
                    'concession_type' => ConcessionTypeEnum::SiblingDiscount,
                    'percentage' => 10,
                    'flat_amount' => null,
                    'reason' => 'Sibling discount for two children enrolled',
                    'is_active' => true,
                ]
            );
        }
    }
}
