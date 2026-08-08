import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const concessionTypes = ['scholarship', 'sibling_discount', 'staff_child', 'financial_aid'];

export default function Form({ concession, students, feeStructures }) {
    const isEdit = Boolean(concession);
    const { data, setData, post, put, processing, errors } = useForm({
        student_id: concession?.student_id ?? '',
        fee_structure_id: concession?.fee_structure_id ?? '',
        concession_type: concession?.concession_type ?? 'scholarship',
        percentage: concession?.percentage ?? '',
        flat_amount: concession?.flat_amount ?? '',
        reason: concession?.reason ?? '',
        is_active: concession?.is_active ?? true,
    });

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
                        <select
                            id="student_id"
                            value={data.student_id}
                            onChange={(e) => setData('student_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">Select student…</option>
                            {(students ?? []).map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.user?.name} ({s.admission_number})
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.student_id} className="mt-2" />
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
