<?php

namespace App\Services;

use App\Enums\InvoiceStatusEnum;
use App\Models\AcademicSession;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeeInvoiceService
{
    public function __construct(
        private InvoiceNumberGenerator $invoiceNumberGenerator,
    ) {}

    public function createInvoice(array $data): FeeInvoice
    {
        return DB::transaction(function () use ($data): FeeInvoice {
            $feeStructure = FeeStructure::findOrFail($data['fee_structure_id']);
            $student = Student::with(['user', 'parents.user'])->findOrFail($data['student_id']);

            $concessionAmount = $this->calculateConcession($student, $feeStructure);

            $invoice = FeeInvoice::create([
                'student_id' => $data['student_id'],
                'academic_session_id' => $feeStructure->academic_session_id,
                'school_class_id' => $feeStructure->school_class_id,
                'fee_structure_id' => $feeStructure->id,
                'invoice_number' => $this->invoiceNumberGenerator->generate($feeStructure->academic_session_id),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $feeStructure->amount,
                'concession_amount' => $concessionAmount,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Create a SINGLE invoice covering the given fee structures, plus an
     * optional custom (one-off) amount.
     *
     * - One structure and no custom amount → a regular invoice linked via
     *   `fee_structure_id` (unchanged behaviour).
     * - Several structures and/or a custom amount → ONE invoice with
     *   `fee_structure_id = null`; each structure is snapshotted in `items`
     *   and the custom amount (if any) is appended as an extra line item.
     * - No structures at all → a custom-only invoice whose session/class
     *   are derived from the student's enrollment.
     */
    public function createInvoiceForStructures(array $data, array $feeStructureIds): FeeInvoice
    {
        $structures = FeeStructure::whereIn('id', $feeStructureIds)->get()->keyBy('id');

        // Keep the order the user selected the structures in.
        $ordered = collect($feeStructureIds)
            ->map(fn ($id) => $structures->get((int) $id))
            ->filter()
            ->values();

        $customAmount = round((float) ($data['custom_amount'] ?? 0), 2);
        $customLabel = trim((string) ($data['custom_label'] ?? ''));
        $customLabel = $customLabel !== '' ? $customLabel : 'Custom Fee';

        if ($ordered->isEmpty()) {
            // Validation guarantees a custom amount when no structure is
            // selected, but stay defensive here.
            if ($customAmount <= 0) {
                throw ValidationException::withMessages([
                    'fee_structure_ids' => 'Select at least one fee structure or enter a custom amount.',
                ]);
            }

            return $this->createCustomAmountInvoice($data, $customAmount, $customLabel);
        }

        if ($ordered->count() === 1 && $customAmount <= 0) {
            return $this->createInvoice([
                'student_id' => $data['student_id'],
                'fee_structure_id' => $ordered->first()->id,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
            ]);
        }

        return DB::transaction(function () use ($data, $ordered, $customAmount, $customLabel): FeeInvoice {
            // A combined invoice belongs to the session/class of the first
            // selected structure (structures are expected to share them).
            $primary = $ordered->first();
            $student = Student::with(['user', 'parents.user'])->findOrFail($data['student_id']);

            $totalAmount = (float) $ordered->sum(fn (FeeStructure $structure): float => (float) $structure->amount);

            // Concessions are calculated per structure (each capped at that
            // structure's amount), then summed and capped at the total.
            // The custom amount is a one-off charge and gets no concession.
            $concessionAmount = 0.0;
            foreach ($ordered as $structure) {
                $concessionAmount += $this->calculateConcession($student, $structure);
            }

            $items = $ordered->map(fn (FeeStructure $structure): array => [
                'fee_structure_id' => $structure->id,
                'name' => $structure->name,
                'amount' => (float) $structure->amount,
            ])->all();

            if ($customAmount > 0) {
                $totalAmount += $customAmount;
                $items[] = [
                    'fee_structure_id' => null,
                    'name' => $customLabel,
                    'amount' => $customAmount,
                ];
            }

            $concessionAmount = min($concessionAmount, $totalAmount);

            $invoice = FeeInvoice::create([
                'student_id' => $data['student_id'],
                'academic_session_id' => $primary->academic_session_id,
                'school_class_id' => $primary->school_class_id,
                'fee_structure_id' => null,
                'items' => $items,
                'invoice_number' => $this->invoiceNumberGenerator->generate($primary->academic_session_id),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $totalAmount,
                'concession_amount' => $concessionAmount,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Create a ONE-OFF invoice for a custom amount (no fee structure). The
     * invoice's session/class come from the student's enrollment in the
     * active academic session (falling back to their latest enrollment).
     */
    private function createCustomAmountInvoice(array $data, float $amount, string $label): FeeInvoice
    {
        return DB::transaction(function () use ($data, $amount, $label): FeeInvoice {
            $student = Student::with(['user', 'parents.user'])->findOrFail($data['student_id']);

            [$academicSessionId, $schoolClassId] = $this->resolveEnrollmentSessionAndClass($student);

            $invoice = FeeInvoice::create([
                'student_id' => $student->id,
                'academic_session_id' => $academicSessionId,
                'school_class_id' => $schoolClassId,
                'fee_structure_id' => null,
                'items' => [
                    ['fee_structure_id' => null, 'name' => $label, 'amount' => $amount],
                ],
                'invoice_number' => $this->invoiceNumberGenerator->generate($academicSessionId),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $amount,
                'concession_amount' => 0,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Resolve the academic session + class a custom-amount invoice should
     * belong to, based on the student's enrollment records.
     *
     * @return array{0: int, 1: int}
     */
    private function resolveEnrollmentSessionAndClass(Student $student): array
    {
        $activeSession = AcademicSession::active()->first();

        $enrollment = $activeSession
            ? StudentEnrollment::where('student_id', $student->id)
                ->where('academic_session_id', $activeSession->id)
                ->latest('enrolled_on')
                ->first()
            : null;

        $enrollment ??= StudentEnrollment::where('student_id', $student->id)
            ->latest('enrolled_on')
            ->first();

        if (! $enrollment) {
            throw ValidationException::withMessages([
                'student_id' => 'This student has no enrollment record. Enroll the student before creating a custom-amount invoice.',
            ]);
        }

        return [(int) $enrollment->academic_session_id, (int) $enrollment->school_class_id];
    }

    /**
     * Send notifications about a new invoice to admins and the student's parents.
     */
    private function notifyInvoiceCreated(FeeInvoice $invoice, Student $student): void
    {
        NotificationService::sendToAdmins([
            'type' => 'invoice_created',
            'title' => "Invoice {$invoice->invoice_number} created",
            'message' => "For student {$student->user->name} — Rs " . number_format((float) $invoice->total_amount, 2),
            'link' => '/fee-invoices/' . $invoice->id,
        ]);

        foreach ($student->parents as $parent) {
            if ($parent->user) {
                NotificationService::send($parent->user, [
                    'type' => 'invoice_created',
                    'title' => "New invoice {$invoice->invoice_number}",
                    'message' => "Amount: Rs " . number_format((float) $invoice->total_amount, 2) . " · Due: {$invoice->due_date}",
                    'link' => '/fee-invoices/' . $invoice->id,
                ]);
            }
        }
    }

    public function bulkGenerate(int $feeStructureId, string $issueDate, string $dueDate): int
    {
        $feeStructure = FeeStructure::findOrFail($feeStructureId);

        $enrollments = StudentEnrollment::where('academic_session_id', $feeStructure->academic_session_id)
            ->where('school_class_id', $feeStructure->school_class_id)
            ->whereNull('deleted_at')
            ->get();

        $count = 0;
        foreach ($enrollments as $enrollment) {
            $existing = FeeInvoice::where('student_id', $enrollment->student_id)
                ->where('fee_structure_id', $feeStructure->id)
                ->whereNull('deleted_at')
                ->exists();

            if ($existing) {
                continue;
            }

            $this->createInvoice([
                'student_id' => $enrollment->student_id,
                'fee_structure_id' => $feeStructure->id,
                'issue_date' => $issueDate,
                'due_date' => $dueDate,
            ]);

            $count++;
        }

        return $count;
    }

    public function updateInvoice(FeeInvoice $invoice, array $data): FeeInvoice
    {
        return DB::transaction(function () use ($invoice, $data): FeeInvoice {
            $invoice->update([
                'total_amount' => $data['total_amount'],
                'concession_amount' => $data['concession_amount'],
                'paid_amount' => $data['paid_amount'],
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
            ]);

            // Recalculate status only (don't re-sum payments, since admin may
            // manually adjust paid_amount to correct a negative balance).
            $balance = (float) $invoice->total_amount - (float) $invoice->concession_amount - (float) $invoice->paid_amount;
            if ($balance <= 0) {
                $invoice->status = InvoiceStatusEnum::Paid;
            } elseif ($invoice->paid_amount > 0) {
                $invoice->status = InvoiceStatusEnum::Partial;
            } else {
                $invoice->status = InvoiceStatusEnum::Unpaid;
            }
            $invoice->save();

            return $invoice->fresh();
        });
    }

    public function cancelInvoice(FeeInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice): void {
            $invoice->status = InvoiceStatusEnum::Cancelled;
            $invoice->save();
        });
    }

    private function calculateConcession(Student $student, FeeStructure $feeStructure): float
    {
        $concessions = FeeConcession::where('student_id', $student->id)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->get();

        $totalConcession = 0;

        foreach ($concessions as $concession) {
            if ($concession->fee_structure_id && $concession->fee_structure_id !== $feeStructure->id) {
                continue;
            }

            if ($concession->percentage !== null) {
                $totalConcession += (float) $feeStructure->amount * ((float) $concession->percentage / 100);
            } elseif ($concession->flat_amount !== null) {
                $totalConcession += (float) $concession->flat_amount;
            }
        }

        return min($totalConcession, (float) $feeStructure->amount);
    }
}
