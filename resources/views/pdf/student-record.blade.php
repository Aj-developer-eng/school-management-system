<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Record — {{ $student->user->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 13px; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .school-info { display: flex; align-items: center; gap: 12px; }
        .school-info img { width: 50px; height: 50px; object-fit: contain; }
        .school-info h1 { font-size: 22px; color: #4f46e5; margin-bottom: 4px; }
        .school-info p { font-size: 12px; color: #666; line-height: 1.5; }
        .record-info { text-align: right; }
        .record-info h2 { font-size: 18px; color: #333; margin-bottom: 4px; }
        .record-info p { font-size: 12px; color: #666; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-active { background: #d1fae5; color: #047857; }
        .badge-inactive { background: #fee2e2; color: #be123c; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #888; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .detail-item .label { font-size: 11px; color: #888; margin-bottom: 2px; }
        .detail-item .value { font-size: 13px; font-weight: 500; color: #333; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .data-table th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #666; border-bottom: 1px solid #e5e7eb; }
        .data-table td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
        .data-table .text-right { text-align: right; }
        .total-row { font-weight: 700; border-top: 2px solid #4f46e5; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #999; }
        @page { margin: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="school-info">
                @if ($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Logo">
                @endif
                <div>
                    <h1>{{ $school->school_name }}</h1>
                    @if ($school->address)
                        <p>{{ $school->address }}</p>
                    @endif
                    @if ($school->phone || $school->email)
                        <p>
                            @if ($school->phone) Phone: {{ $school->phone }}@endif
                            @if ($school->email) Email: {{ $school->email }}@endif
                        </p>
                    @endif
                </div>
            </div>
            <div class="record-info">
                <h2>Student Record</h2>
                <p>Generated: {{ now()->format('d M Y, h:i A') }}</p>
                <p>Admission #: <strong>{{ $student->admission_number }}</strong></p>
                <span class="badge badge-{{ $student->is_active ? 'active' : 'inactive' }}">{{ $student->is_active ? 'Active' : 'Inactive' }}</span>
            </div>
        </div>

        {{-- Personal Information --}}
        <div class="section">
            <p class="section-title">Personal Information</p>
            <div class="details-grid">
                <div class="detail-item">
                    <p class="label">Full Name</p>
                    <p class="value">{{ $student->user->name }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Email</p>
                    <p class="value">{{ $student->user->email ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Phone</p>
                    <p class="value">{{ $student->user->phone ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Date of Birth</p>
                    <p class="value">{{ $student->date_of_birth?->format('d M Y') ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Gender</p>
                    <p class="value">{{ $student->gender ? ucfirst($student->gender) : '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Blood Group</p>
                    <p class="value">{{ $student->blood_group ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Religion</p>
                    <p class="value">{{ $student->religion ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Nationality</p>
                    <p class="value">{{ $student->nationality ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">CNIC / B-Form</p>
                    <p class="value">{{ $student->cnic_bform ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Admission Date</p>
                    <p class="value">{{ $student->admission_date?->format('d M Y') ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Previous School</p>
                    <p class="value">{{ $student->previous_school ?? '—' }}</p>
                </div>
                <div class="detail-item">
                    <p class="label">Medical Notes</p>
                    <p class="value">{{ $student->medical_notes ?? '—' }}</p>
                </div>
                <div class="detail-item" style="grid-column: span 3;">
                    <p class="label">Address</p>
                    <p class="value">{{ $student->address ?? '—' }}</p>
                </div>
            </div>
        </div>

        {{-- Enrollment History --}}
        <div class="section">
            <p class="section-title">Enrollment History</p>
            @if ($student->enrollments->isNotEmpty())
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Session</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Enrolled On</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($student->enrollments as $enrollment)
                            <tr>
                                <td>{{ $enrollment->academicSession?->name ?? '—' }}</td>
                                <td>{{ $enrollment->schoolClass?->name ?? '—' }}</td>
                                <td>{{ $enrollment->section?->name ?? '—' }}</td>
                                <td>{{ $enrollment->enrolled_on?->format('d M Y') ?? '—' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 12px; color: #999;">No enrollment records.</p>
            @endif
        </div>

        {{-- Parents / Guardians --}}
        <div class="section">
            <p class="section-title">Parents / Guardians</p>
            @if ($student->parents->isNotEmpty())
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Relationship</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Occupation</th>
                            <th>Primary?</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($student->parents as $parent)
                            <tr>
                                <td>{{ $parent->user?->name ?? '—' }}</td>
                                <td>{{ $parent->pivot->guardian_type ?? 'Guardian' }}</td>
                                <td>{{ $parent->user?->email ?? '—' }}</td>
                                <td>{{ $parent->user?->phone ?? '—' }}</td>
                                <td>{{ $parent->occupation ?? '—' }}</td>
                                <td>{{ $parent->pivot->is_primary_contact ? 'Yes' : 'No' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="font-size: 12px; color: #999;">No parent records.</p>
            @endif
        </div>

        {{-- Fee Invoices & Payments --}}
        <div class="section">
            <p class="section-title">Fee Invoices & Payment Summary</p>
            @php
                $totalInvoiced = $student->invoices->sum('total_amount');
                $totalPaid = $student->invoices->sum('paid_amount');
                $totalBalance = $student->invoices->sum('balance');
            @endphp
            @if ($student->invoices->isNotEmpty())
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Session</th>
                            <th>Fee Structure</th>
                            <th class="text-right">Total</th>
                            <th class="text-right">Paid</th>
                            <th class="text-right">Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($student->invoices as $invoice)
                            <tr>
                                <td>{{ $invoice->invoice_number }}</td>
                                <td>{{ $invoice->academicSession?->name ?? '—' }}</td>
                                <td>{{ $invoice->feeStructure?->name ?? '—' }}</td>
                                <td class="text-right">Rs {{ number_format((float) $invoice->total_amount, 2) }}</td>
                                <td class="text-right">Rs {{ number_format((float) $invoice->paid_amount, 2) }}</td>
                                <td class="text-right">Rs {{ number_format((float) $invoice->balance, 2) }}</td>
                                <td>{{ ucfirst($invoice->status->value) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3">Totals</td>
                            <td class="text-right">Rs {{ number_format((float) $totalInvoiced, 2) }}</td>
                            <td class="text-right">Rs {{ number_format((float) $totalPaid, 2) }}</td>
                            <td class="text-right">Rs {{ number_format((float) $totalBalance, 2) }}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            @else
                <p style="font-size: 12px; color: #999;">No invoice records.</p>
            @endif
        </div>

        <div class="footer">
            @if ($school->footer_text)
                {{ $school->footer_text }}
            @else
                This is a computer-generated student record and does not require a signature.
            @endif
        </div>
    </div>
</body>
</html>
