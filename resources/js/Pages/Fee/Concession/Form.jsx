import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableSelect from '@/Components/Ui/SearchableSelect';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const concessionTypes = ['scholarship', 'sibling_discount', 'staff_child', 'financial_aid'];

export default function Form({ concession, students, feeStructures, feeInvoices }) {
    const isEdit = Boolean(concession);
    const { data, setData, post, put, processing, errors } = useForm({
        student_id: concession?.student_id ?? '',
        fee_structure_id: concession?.fee_structure_id ?? '',
        fee_invoice_id: concession?.fee_invoice_id ?? '',
        concession_type: concession?.concession_type ?? 'scholarship',
        percentage: concession?.percentage ?? '',
        flat_amount: concession?.flat_amount ?? '',
        reason: concession?.reason ?? '',
        is_active: concession?.is_active ?? true,
    });

    const filteredInvoices = (feeInvoices ?? []).filter(
        (inv) => !data.student_id || inv.student_id === Number(data.student_id),
    );

    const [discountMode, setDiscountMode] = useState(
        concession?.percentage ? 'percentage' : concession?.flat_amount ? 'flat' : 'percentage',
    );

    const submit = (event) => {
        event.preventDefault();
        const payload = { ...data };
        if (discountMode === 'percentage') {
            payload.flat_amount = '';
        } else {
            payload.percentage = '';
        }

        if (isEdit) {
            put(route('fee-concessions.update', concession.id), { data: payload });
        } else {
            post(route('fee-concessions.store'), { data: payload });
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Concession' : 'New Concession'}
            breadcrumbs={[
                { label: 'Fee Concessions', href: route('fee-concessions.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Concession' : 'New Concession'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="student_id" value="Student" />
                        <SearchableSelect
                            id="student_id"
                            value={data.student_id}
                            // Changing student invalidates the picked invoice — clear it
                            // rather than keep one belonging to the previous student.
                            onChange={(value) => setData({ ...data, student_id: value, fee_invoice_id: '' })}
                            options={students ?? []}
                            placeholder="Search student by name or admission #…"
                            emptyMessage="No students match your search"
                        />
                        <InputError message={errors.student_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="fee_invoice_id" value="Invoice (required — concession is applied to this invoice)" />
                        <SearchableSelect
                            id="fee_invoice_id"
                            value={data.fee_invoice_id}
                            // Picking an invoice keeps the form consistent by syncing
                            // the selected student to the invoice's student.
                            onChange={(value) => {
                                const inv = filteredInvoices.find((i) => String(i.value) === String(value));
                                setData('fee_invoice_id', value);
                                if (inv) {
                                    setData('student_id', String(inv.student_id));
                                }
                            }}
                            options={filteredInvoices}
                            placeholder="Search invoice by number or student…"
                            emptyMessage="No invoices match your search"
                        />
                        <InputError message={errors.fee_invoice_id} className="mt-2" />
                        {data.student_id && filteredInvoices.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">No invoices found for this student.</p>
                        )}
                    </div>

                    <div>
                        <InputLabel htmlFor="fee_structure_id" value="Fee Structure (leave empty for all)" />
                        <select
                            id="fee_structure_id"
                            value={data.fee_structure_id}
                            onChange={(e) => setData('fee_structure_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">All fee structures</option>
                            {(feeStructures ?? []).map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.fee_structure_id} className="mt-2" />
                        {data.fee_invoice_id && (
                            <p className="mt-1 text-xs text-gray-400">When an invoice is selected, the fee structure filter is ignored for that invoice.</p>
                        )}
                    </div>

                    <div>
                        <InputLabel htmlFor="concession_type" value="Concession Type" />
                        <select
                            id="concession_type"
                            value={data.concession_type}
                            onChange={(e) => setData('concession_type', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            {concessionTypes.map((t) => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                            ))}
                        </select>
                        <InputError message={errors.concession_type} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel value="Discount Type" />
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    checked={discountMode === 'percentage'}
                                    onChange={() => setDiscountMode('percentage')}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                Percentage (%)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="radio"
                                    checked={discountMode === 'flat'}
                                    onChange={() => setDiscountMode('flat')}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                Flat Amount (Rs)
                            </label>
                        </div>
                    </div>

                    {discountMode === 'percentage' ? (
                        <div>
                            <InputLabel htmlFor="percentage" value="Percentage (%)" />
                            <TextInput
                                id="percentage"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.percentage}
                                onChange={(e) => setData('percentage', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.percentage} className="mt-2" />
                        </div>
                    ) : (
                        <div>
                            <InputLabel htmlFor="flat_amount" value="Flat Amount (Rs)" />
                            <TextInput
                                id="flat_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.flat_amount}
                                onChange={(e) => setData('flat_amount', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.flat_amount} className="mt-2" />
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="reason" value="Reason (optional)" />
                        <textarea
                            id="reason"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.reason} className="mt-2" />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <InputLabel htmlFor="is_active" value="Active" />
                    </div>
                    <InputError message={errors.is_active} className="mt-2" />

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Concession' : 'Create Concession'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
