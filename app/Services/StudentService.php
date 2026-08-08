<?php

namespace App\Services;

use App\Enums\GenderEnum;
use App\Enums\RoleEnum;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentService
{
    public function __construct(private readonly AdmissionNumberGenerator $admissionNumbers) {}

    public function create(array $data): Student
    {
        return DB::transaction(function () use ($data): Student {
            $admissionDate = Carbon::parse($data['admission_date']);
            $admissionNumber = $this->admissionNumbers->next($admissionDate->year);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'] ?? $this->generateEmail($admissionNumber),
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($this->defaultPassword($admissionNumber)),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $user->assignRole(RoleEnum::Student->value);

            $student = Student::create([
                'user_id' => $user->id,
                'admission_number' => $admissionNumber,
                'admission_date' => $admissionDate,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'blood_group' => $data['blood_group'] ?? null,
                'religion' => $data['religion'] ?? null,
                'nationality' => $data['nationality'] ?? 'Pakistani',
                'cnic_bform' => $data['cnic_bform'] ?? null,
                'address' => $data['address'] ?? null,
                'previous_school' => $data['previous_school'] ?? null,
                'medical_notes' => $data['medical_notes'] ?? null,
                'is_active' => true,
            ]);

            StudentEnrollment::create([
                'student_id' => $student->id,
                'academic_session_id' => $data['academic_session_id'],
                'school_class_id' => $data['school_class_id'],
                'section_id' => $data['section_id'],
                'roll_number' => $data['roll_number'] ?? null,
                'enrolled_on' => $data['enrolled_on'] ?? now()->toDateString(),
                'status' => 'active',
            ]);

            return $student;
        });
    }

    public function update(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data): Student {
            $student->update([
                'admission_date' => $data['admission_date'],
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'blood_group' => $data['blood_group'] ?? null,
                'religion' => $data['religion'] ?? null,
                'nationality' => $data['nationality'] ?? 'Pakistani',
                'cnic_bform' => $data['cnic_bform'] ?? null,
                'address' => $data['address'] ?? null,
                'previous_school' => $data['previous_school'] ?? null,
                'medical_notes' => $data['medical_notes'] ?? null,
            ]);

            $student->user->update([
                'name' => $data['name'],
                'email' => $data['email'] ?? $student->user->email,
                'phone' => $data['phone'] ?? null,
            ]);

            $enrollment = $student->enrollments()->firstOrCreate(
                ['academic_session_id' => $data['academic_session_id']],
                [
                    'school_class_id' => $data['school_class_id'],
                    'section_id' => $data['section_id'],
                    'roll_number' => $data['roll_number'] ?? null,
                    'enrolled_on' => $data['enrolled_on'] ?? now()->toDateString(),
                    'status' => 'active',
                ]
            );

            $enrollment->update([
                'school_class_id' => $data['school_class_id'],
                'section_id' => $data['section_id'],
                'roll_number' => $data['roll_number'] ?? null,
                'enrolled_on' => $data['enrolled_on'] ?? $enrollment->enrolled_on,
            ]);

            return $student->load(['user', 'enrollments.academicSession', 'enrollments.schoolClass', 'enrollments.section']);
        });
    }

    private function generateEmail(string $admissionNumber): string
    {
        return strtolower(str_replace(['-', ' '], '', $admissionNumber)).'@student.local';
    }

    private function defaultPassword(string $admissionNumber): string
    {
        return $admissionNumber.'@123';
    }
}
