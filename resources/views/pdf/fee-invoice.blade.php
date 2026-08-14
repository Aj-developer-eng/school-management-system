<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 14px; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .school-info { display: flex; align-items: center; gap: 12px; }
        .school-info img { width: 50px; height: 50px; object-fit: contain; }
        .school-info h1 { font-size: 22px; color: #4f46e5; margin-bottom: 4px; }
        .school-info p { font-size: 12px; color: #666; line-height: 1.5; }
        .invoice-info { text-align: right; }
        .invoice-info h2 { font-size: 18px; color: #333; margin-bottom: 4px; }
        .invoice-info p { font-size: 12px; color: #666; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-unpaid { background: #fee2e2; color: #be123c; }
        .badge-partial { background: #fef3c7; color: #b45309; }
        .badge-paid { background: #d1fae5; color: #047857; }
        .badge-cancelled { background: #f3f4f6; color: #6b7280; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #888; margin-bottom: 8px; }
        .student-details { display: flex; gap: 40px; }
        .student-details .label { font-size: 11px; color: #888; }
        .student-details .value { font-size: 14px; font-weight: 500; color: #333; }
        .amounts-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .amounts-table td { padding: 10px 0; font-size: 14px; }
        .amounts-table .label { color: #666; }
        .amounts-table .amount { text-align: right; font-weight: 500; }
        .amounts-table .total-row { border-top: 2px solid #4f46e5; font-size: 16px; font-weight: 700; padding-top: 12px; }
        .amounts-table .total-row .label { color: #333; }
        .payments-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .payments-table th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #666; border-bottom: 1px solid #e5e7eb; }
        .payments-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #999; }
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
            <div class="invoice-info">
                <h2>Fee Invoice</h2>
                <p><strong>{{ $invoice->invoice_number }}</strong></p>
                <p>Issue Date: {{ $invoice->issue_date->format('d M Y') }}</p>
                <p>Due Date: {{ $invoice->due_date->format('d M Y') }}</p>
                <span class="badge badge-{{ $invoice->status->value }}">{{ $invoice->status->label() }}</span>
            </div>
        </div>

        <div class="section">
            <p class="section-title">Student Information</p>
            <div class="student-details">
                <div>
                    <p class="label">Name</p>
                    <p class="value">{{ $invoice->student->user->name }}</p>
                </div>
                <div>
                    <p class="label">Class</p>
                    <p class="value">{{ $invoice->schoolClass->name }}</p>
                </div>
                <div>
                    <p class="label">Session</p>
                    <p class="value">{{ $invoice->academicSession->name }}</p>
                </div>
                <div>
                    <p class="label">Admission No.</p>
                    <p class="value">{{ $invoice->student->admission_number }}</p>
                </div>
            </div>
        </div>

        <div class="section">
            <p class="section-title">Fee Details</p>
            <p style="font-size: 14px; margin-bottom: 12px;">{{ $invoice->feeStructure->name }}</p>

            <table class="amounts-table">
                <tr>
                    <td class="label">Total Amount</td>
                    <td class="amount">Rs {{ number_format((float) $invoice->total_amount, 2) }}</td>
                </tr>
                <tr>
                    <td class="label">Concession</td>
                    <td class="amount">- Rs {{ number_format((float) $invoice->concession_amount, 2) }}</td>
                </tr>
                <tr>
                    <td class="label">Paid Amount</td>
                    <td class="amount">Rs {{ number_format((float) $invoice->paid_amount, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">Balance Due</td>
                    <td class="amount">Rs {{ number_format((float) $invoice->balance, 2) }}</td>
                </tr>
            </table>
        </div>

        @if ($invoice->payments->isNotEmpty())
            <div class="section">
                <p class="section-title">Payment History</p>
                <table class="payments-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($invoice->payments as $payment)
                            <tr>
                                <td>{{ $payment->payment_date->format('d M Y') }}</td>
                                <td>Rs {{ number_format((float) $payment->amount, 2) }}</td>
                                <td>{{ $payment->payment_method }}</td>
                                <td>{{ $payment->transaction_reference ?? '—' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif

        <div class="footer">
            @if ($school->footer_text)
                {{ $school->footer_text }}
            @else
                This is a computer-generated invoice and does not require a signature.
            @endif
        </div>
    </div>
</body>
</html>
