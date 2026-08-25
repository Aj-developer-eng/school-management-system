<?php

namespace App\Services;

use App\Enums\RoleEnum;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentParentService
{
    public function create(array $data): StudentParent
    {
        return DB::transaction(function () use ($data): StudentParent {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
                'email_verified_at' => now(),
            ]);
            $user->assignRole(RoleEnum::Parent->value);

            $parent = StudentParent::create([
                'user_id' => $user->id,
                'occupation' => $data['occupation'] ?? null,
                'cnic' => $data['cnic'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'address' => $data['address'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->syncStudents($parent, $data['students'] ?? []);

            return $parent->load('user', 'students.user');
        });
    }

    public function update(StudentParent $parent, array $data): StudentParent
    {
        return DB::transaction(function () use ($parent, $data): StudentParent {
            $parent->update([
                'occupation' => $data['occupation'] ?? null,
                'cnic' => $data['cnic'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'address' => $data['address'] ?? null,
                'is_active' => $data['is_active'] ?? $parent->is_active,
            ]);

            $parent->user->update([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? $parent->is_active,
            ]);

            if (! empty($data['password'])) {
                $parent->user->update(['password' => Hash::make($data['password'])]);
            }

            $this->syncStudents($parent, $data['students'] ?? []);

            return $parent->load('user', 'students.user');
        });
    }

    private function syncStudents(StudentParent $parent, array $students): void
    {
        if (empty($students)) {
            return;
        }

        // Ensure only one primary contact per student.
        $primaryByStudent = [];
        foreach ($students as $row) {
            if (! empty($row['is_primary_contact'])) {
                $primaryByStudent[$row['student_id']] = true;
            }
        }

        $syncData = collect($students)
            ->keyBy('student_id')
            ->map(fn ($row) => [
                'guardian_type' => $row['guardian_type'],
                'is_primary_contact' => ! empty($row['is_primary_contact']),
            ])
            ->all();

        $parent->students()->sync($syncData);

        foreach ($primaryByStudent as $studentId => $true) {
            \DB::table('parent_student')
                ->where('student_id', $studentId)
                ->whereNot('parent_id', $parent->id)
                ->update(['is_primary_contact' => false]);
        }
    }
}
