<?php

namespace App\Services;

use App\Enums\InvoiceStatusEnum;
use App\Models\FeeConcession;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentParent;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FeeInvoiceService
{
    public function __construct(
        private InvoiceNumberGenerator $invoiceNumberGenerator,
    ) {}

    public function createInvoice(array $data): FeeInvoice
    {
        return DB::transaction(function () use ($data): FeeInvoice {
            $feeStructure = FeeStructure::findOrFail($data['fee_structure_id']);
            $student = Student::findOrFail($data['student_id']);

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
