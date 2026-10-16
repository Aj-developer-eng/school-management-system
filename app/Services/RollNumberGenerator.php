<?php

namespace App\Services;

use App\Models\RollNumberCounter;
use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Builder;
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

            return $this->format($number);
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

        return $this->format($number);
    }

    private function taken(int $academicSessionId, int $schoolClassId, int $number): bool
    {
        return StudentEnrollment::withTrashed()
            ->where('academic_session_id', $academicSessionId)
            ->where('school_class_id', $schoolClassId)
            // Match both the padded form ("0001") and legacy unpadded
            // entries ("1") so neither can ever be reissued.
            ->where(function (Builder $query) use ($number): void {
                $query
                    ->where('roll_number', $this->format($number))
                    ->orWhere('roll_number', (string) $number);
            })
            ->exists();
    }

    /**
     * Roll numbers are four-digit, zero-padded strings ("0001", "0002", ...),
     * widening naturally to five digits past 9999.
     */
    private function format(int $number): string
    {
        return sprintf('%04d', $number);
    }
}
