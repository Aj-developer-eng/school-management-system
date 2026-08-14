import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'card', 'other'];

export default function Form({ invoice, invoices }) {
    const { data, setData, post, processing, errors } = useForm({
        fee_invoice_id: invoice?.id ?? '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        transaction_reference: '',
        remarks: '',
        evidence: null,
    });

    const [selectedInvoice, setSelectedInvoice] = useState(invoice ?? null);
    const [evidencePreview, setEvidencePreview] = useState(null);
    const evidenceInputRef = useRef(null);

    const handleEvidenceChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('evidence', file);
            setEvidencePreview(URL.createObjectURL(file));
        }
    };

    const handleEvidenceRemove = () => {
        setData('evidence', null);
        setEvidencePreview(null);
        if (evidenceInputRef.current) {
            evidenceInputRef.current.value = '';
        }
    };

    const handleInvoiceChange = (e) => {
        const id = e.target.value;
        setData('fee_invoice_id', id);
        const found = invoices?.find((inv) => String(inv.id) === id);
        setSelectedInvoice(found ?? null);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('fee-payments.store'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            title="Record Payment"
            breadcrumbs={[
                { label: 'Fee Invoices', href: route('fee-invoices.index') },
                { label: 'Record Payment' },
            ]}
        >
            <Head title="Record Payment" />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="fee_invoice_id" value="Invoice" />
                        {invoice ? (
                            <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                                <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {invoice.student?.user?.name} · Balance: Rs {Number(invoice.balance).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <select
                                id="fee_invoice_id"
                                value={data.fee_invoice_id}
                                onChange={handleInvoiceChange}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select invoice…</option>
                                {(invoices ?? []).map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoice_number} — {inv.student?.user?.name} (Balance: Rs {Number(inv.balance).toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        )}
                        <InputError message={errors.fee_invoice_id} className="mt-2" />
                    </div>

                    {selectedInvoice && (
                        <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                            <p className="text-gray-600 dark:text-gray-400">
                                Total: <span className="font-semibold">Rs {Number(selectedInvoice.total_amount).toLocaleString()}</span>
                                {' · '}Concession: Rs {Number(selectedInvoice.concession_amount).toLocaleString()}
                                {' · '}Paid: Rs {Number(selectedInvoice.paid_amount).toLocaleString()}
                                {' · '}<span className="font-semibold text-rose-600 dark:text-rose-400">Balance: Rs {Number(selectedInvoice.balance).toLocaleString()}</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="amount" value="Amount (Rs)" />
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                            />
                            <InputError message={errors.amount} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="payment_date" value="Payment Date" />
                            <TextInput
                                id="payment_date"
                                type="date"
                                value={data.payment_date}
                                onChange={(e) => setData('payment_date', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.payment_date} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="payment_method" value="Payment Method" />
                        <select
                            id="payment_method"
                            value={data.payment_method}
                            onChange={(e) => setData('payment_method', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            {paymentMethods.map((m) => (
                                <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                            ))}
                        </select>
                        <InputError message={errors.payment_method} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="transaction_reference" value="Transaction Reference (optional)" />
                        <TextInput
                            id="transaction_reference"
                            value={data.transaction_reference}
                            onChange={(e) => setData('transaction_reference', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.transaction_reference} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="remarks" value="Remarks (optional)" />
                        <textarea
                            id="remarks"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.remarks} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="evidence" value="Payment Evidence (optional)" />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Upload a screenshot or photo of the payment receipt (JPG, PNG, WebP — max 4MB).
                        </p>
                        <input
                            ref={evidenceInputRef}
                            id="evidence"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleEvidenceChange}
                            className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                        />
                        <InputError message={errors.evidence} className="mt-2" />
                        {evidencePreview && (
                            <div className="mt-3">
                                <img src={evidencePreview} alt="Evidence preview" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700" />
                                <button
                                    type="button"
                                    onClick={handleEvidenceRemove}
                                    className="mt-2 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400"
                                >
                                    Remove image
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            Record Payment
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
