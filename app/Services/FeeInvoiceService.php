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

            // Structures saved without a session/class fall back to the student's
            // enrollment (and finally the active session) so the invoice row —
            // whose invoice-number series is keyed by session — always belongs
            // to a session.
            $academicSessionId = $this->resolveAcademicSessionId($feeStructure, $student);

            $invoice = FeeInvoice::create([
                'student_id' => $data['student_id'],
                'academic_session_id' => $academicSessionId,
                'school_class_id' => $feeStructure->school_class_id ?? $this->studentClassId($student, $academicSessionId),
                'fee_structure_id' => $feeStructure->id,
                'invoice_number' => $this->invoiceNumberGenerator->generate($academicSessionId),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $feeStructure->amount,
                'concession_amount' => $concessionAmount,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            // Optional concession captured on the invoice form. It is recorded
            // against this invoice and added on top of any concessions already
            // applied above (which were calculated before this row existed).
            $concession = $data['concession'] ?? null;
            if (is_array($concession) && $concession !== []) {
                $concessionAmount += $this->storeInvoiceConcession($invoice, $feeStructure, $concession);
                $invoice->concession_amount = min($concessionAmount, (float) $feeStructure->amount);
            }

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Create one invoice combining several fee structures. The invoice total
     * is the sum of the structures' amounts, the student's existing
     * concessions are computed per structure (so structure-specific ones only
     * touch their own amount) and capped at the combined total, and the
     * structures are recorded on the fee_invoice_fee_structures pivot.
     */
    public function createCombinedInvoice(array $data, array $feeStructureIds): FeeInvoice
    {
        return DB::transaction(function () use ($data, $feeStructureIds): FeeInvoice {
            $feeStructures = FeeStructure::whereIn('id', $feeStructureIds)->orderBy('id')->get();

            // `exists` counts soft-deleted rows, so the request can pass
            // validation while nothing loadable remains.
            if ($feeStructures->isEmpty()) {
                throw ValidationException::withMessages([
                    'fee_structure_ids' => 'The selected fee structures are not available.',
                ]);
            }

            $student = Student::with(['user', 'parents.user'])->findOrFail($data['student_id']);

            $totalAmount = (float) $feeStructures->sum(fn (FeeStructure $structure): float => (float) $structure->amount);

            $concessionAmount = 0.0;
            foreach ($feeStructures as $structure) {
                $concessionAmount += $this->calculateConcession($student, $structure);
            }
            $concessionAmount = min($concessionAmount, $totalAmount);

            // The invoice row carries a single session/class (used for the
            // invoice-number series). When the selected structures span
            // sessions or classes, the first structure's values are used; the
            // pivot still records every structure individually. Missing values
            // fall back to the student's enrollment / the active session.
            $firstStructure = $feeStructures->first();
            $academicSessionId = $this->resolveAcademicSessionId($firstStructure, $student);

            $invoice = FeeInvoice::create([
                'student_id' => $data['student_id'],
                'academic_session_id' => $academicSessionId,
                'school_class_id' => $firstStructure->school_class_id ?? $this->studentClassId($student, $academicSessionId),
                'fee_structure_id' => null,
                'invoice_number' => $this->invoiceNumberGenerator->generate($academicSessionId),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $totalAmount,
                'concession_amount' => $concessionAmount,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            $invoice->feeStructures()->attach($feeStructures->pluck('id'));

            // Optional concession captured on the invoice form. A percentage
            // applies to the combined total; a flat amount applies once and
            // is capped at the combined total — both match the preview.
            $concession = $data['concession'] ?? null;
            if (is_array($concession) && $concession !== []) {
                $concessionAmount += $this->storeInvoiceConcession($invoice, null, $concession);
                $invoice->concession_amount = min($concessionAmount, $totalAmount);
            }

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Create an invoice for an amount typed directly on the form (no fee
     * structure linked and no pivot rows). The total is stored exactly as
     * provided; the student's standing concessions are NOT auto-applied here —
     * only the optional concession submitted with the form is recorded (based
     * on the invoice total, capped at that total). Session and class resolve
     * from the student's enrollment / the active session.
     */
    public function createCustomInvoice(array $data): FeeInvoice
    {
        return DB::transaction(function () use ($data): FeeInvoice {
            $student = Student::with(['user', 'parents.user'])->findOrFail($data['student_id']);
            $totalAmount = (float) $data['custom_amount'];

            $academicSessionId = $this->resolveAcademicSessionId(null, $student);

            $invoice = FeeInvoice::create([
                'student_id' => $data['student_id'],
                'academic_session_id' => $academicSessionId,
                'school_class_id' => $this->studentClassId($student, $academicSessionId),
                'fee_structure_id' => null,
                'invoice_number' => $this->invoiceNumberGenerator->generate($academicSessionId),
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'total_amount' => $totalAmount,
                'concession_amount' => 0,
                'paid_amount' => 0,
                'status' => InvoiceStatusEnum::Unpaid,
            ]);

            // Optional concession captured on the invoice form. With no fee
            // structure attached, storeInvoiceConcession bases it on the
            // invoice total; the cap keeps it from exceeding that total.
            $concession = $data['concession'] ?? null;
            if (is_array($concession) && $concession !== []) {
                $invoice->concession_amount = min($this->storeInvoiceConcession($invoice, null, $concession), $totalAmount);
            }

            $invoice->recalculate();

            $this->notifyInvoiceCreated($invoice, $student);

            return $invoice;
        });
    }

    /**
     * Persist a concession (submitted from the invoice form) against the given
     * invoice and return its monetary value. When $feeStructure is null the
     * concession applies to the whole invoice and its value is based on the
     * invoice's combined total_amount.
     */
    private function storeInvoiceConcession(FeeInvoice $invoice, ?FeeStructure $feeStructure, array $data): float
    {
        $percentage = $this->toFloatOrNull($data['percentage'] ?? null);
        $flatAmount = $this->toFloatOrNull($data['flat_amount'] ?? null);

        FeeConcession::create([
            'student_id' => $invoice->student_id,
            'fee_structure_id' => $feeStructure?->id,
            'fee_invoice_id' => $invoice->id,
            'concession_type' => $data['concession_type'],
            'percentage' => $percentage,
            'flat_amount' => $flatAmount,
            'reason' => $data['reason'] ?? null,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
        ]);

        $baseAmount = $feeStructure !== null ? (float) $feeStructure->amount : (float) $invoice->total_amount;

        if ($percentage !== null) {
            return $baseAmount * $percentage / 100;
        }

        return $flatAmount ?? 0.0;
    }

    private function toFloatOrNull(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
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

        // A structure saved without a session targets the active session; one
        // without a class targets every class in that session (school-wide).
        $academicSessionId = $feeStructure->academic_session_id ?? AcademicSession::active()->first()?->id;

        if ($academicSessionId === null) {
            return 0;
        }

        $enrollments = StudentEnrollment::where('academic_session_id', $academicSessionId)
            ->when($feeStructure->school_class_id, fn ($query, $classId) => $query->where('school_class_id', $classId))
            ->whereNull('deleted_at')
            ->get();

        $count = 0;
        foreach ($enrollments as $enrollment) {
            // Combined invoices link structures via the pivot, so the
            // duplicate check looks there too.
            $existing = FeeInvoice::where('student_id', $enrollment->student_id)
                ->whereNull('deleted_at')
                ->where(function ($query) use ($feeStructure): void {
                    $query->where('fee_structure_id', $feeStructure->id)
                        ->orWhereHas('feeStructures', fn ($q) => $q->where('fee_structures.id', $feeStructure->id));
                })
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

    /**
     * Resolve the academic session for a new invoice. A linked fee structure's
     * own session wins; custom invoices (no structure) and structures saved
     * without a session fall back to the student's most recent enrollment and
     * finally to the active session (the invoice number series is keyed by
     * session, so a session is always required).
     */
    private function resolveAcademicSessionId(?FeeStructure $feeStructure, ?Student $student = null): int
    {
        $sessionId = $feeStructure?->academic_session_id
            ?? ($student !== null ? $this->studentEnrollmentSessionId($student) : null)
            ?? AcademicSession::active()->first()?->id;

        if ($sessionId === null) {
            throw ValidationException::withMessages([
                'academic_session_id' => 'No academic session is available for this invoice. Assign a session to the fee structure or activate an academic session.',
            ]);
        }

        return $sessionId;
    }

    /**
     * The session of the student's most recent enrollment, if any.
     */
    private function studentEnrollmentSessionId(Student $student): ?int
    {
        $sessionId = $student->enrollments()
            ->whereNull('deleted_at')
            ->latest('id')
            ->value('academic_session_id');

        return $sessionId === null ? null : (int) $sessionId;
    }

    /**
     * The class the student is enrolled in for the given session, if any —
     * used when the fee structure was saved without a class.
     */
    private function studentClassId(Student $student, int $academicSessionId): ?int
    {
        $classId = $student->enrollments()
            ->where('academic_session_id', $academicSessionId)
            ->whereNull('deleted_at')
            ->value('school_class_id');

        return $classId === null ? null : (int) $classId;
    }
}
