<?php

namespace App\Services;

use App\Models\RollNumberCounter;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;

class RollNumberGenerator
{
    /**
     * Atomically consume and return the next roll number for a class in a session.
     *
     * Roll numbers already taken by existing enrollments (e.g. legacy manual
     * entries that never went through the counter) are skipped so a unique
     * value is always returned.
     */
    public function next(int $academicSessionId, int $schoolClassId): string
    {
        return DB::transaction(function () use ($academicSessionId, $schoolClassId): string {
            $counter = RollNumberCounter::lockForUpdate()
                ->firstOrCreate(
                    [
                        'academic_session_id' => $academicSessionId,
                        'school_class_id' => $schoolClassId,
                    ],
                    ['last_number' => 0]
                );

            $number = $counter->last_number + 1;

            while ($this->taken($academicSessionId, $schoolClassId, $number)) {
                $number++;
            }

            $counter->last_number = $number;
            $counter->save();

            return (string) $number;
        });
    }

    /**
     * Return the roll number that `next()` would produce, without consuming it.
     *
     * The counter row is only read (never created) so opening the create form
     * repeatedly does not advance the sequence.
     */
    public function preview(int $academicSessionId, int $schoolClassId): string
    {
        $lastNumber = RollNumberCounter::query()
            ->where('academic_session_id', $academicSessionId)
            ->where('school_class_id', $schoolClassId)
            ->value('last_number') ?? 0;

        $number = $lastNumber + 1;

        while ($this->taken($academicSessionId, $schoolClassId, $number)) {
            $number++;
        }

        return (string) $number;
    }

    private function taken(int $academicSessionId, int $schoolClassId, int $number): bool
    {
        return StudentEnrollment::withTrashed()
            ->where('academic_session_id', $academicSessionId)
            ->where('school_class_id', $schoolClassId)
            ->where('roll_number', (string) $number)
            ->exists();
    }
}
