import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Form({ students, feeStructures, invoice }) {
    const isEdit = Boolean(invoice);

    const toDateInput = (value) => {
        if (!value) return '';
        return String(value).split('T')[0];
    };

    const { data, setData, post, put, processing, errors } = useForm(
        isEdit
            ? {
                  total_amount: Number(invoice.total_amount),
                  concession_amount: Number(invoice.concession_amount),
                  paid_amount: Number(invoice.paid_amount),
                  issue_date: toDateInput(invoice.issue_date),
                  due_date: toDateInput(invoice.due_date),
              }
            : {
                  student_id: '',
                  fee_structure_id: '',
                  issue_date: new Date().toISOString().split('T')[0],
                  due_date: '',
              },
    );

    const [selectedStructure, setSelectedStructure] = useState(null);

    const handleStructureChange = (e) => {
        const id = e.target.value;
        setData('fee_structure_id', id);
        const structure = feeStructures?.find((s) => String(s.id) === id);
        setSelectedStructure(structure ?? null);
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('fee-invoices.update', invoice.id));
        } else {
            post(route('fee-invoices.store'));
        }
    };

    const balance = isEdit
        ? Number(data.total_amount) - Number(data.concession_amount) - Number(data.paid_amount)
        : null;

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Invoice' : 'New Invoice'}
            breadcrumbs={[
                { label: 'Fee Invoices', href: route('fee-invoices.index') },
                { label: isEdit ? `Edit ${invoice.invoice_number}` : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Invoice' : 'New Invoice'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    {isEdit ? (
                        <>
                            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
                                <p className="font-medium text-gray-700 dark:text-gray-200">
                                    Invoice: {invoice.invoice_number}
                                </p>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Student: {invoice.student?.user?.name} · {invoice.school_class?.name} · {invoice.academic_session?.name}
                                </p>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Fee Structure: {invoice.fee_structure?.name}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <InputLabel htmlFor="total_amount" value="Total Amount" />
                                    <TextInput
                                        id="total_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.total_amount}
                                        onChange={(e) => setData('total_amount', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.total_amount} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="concession_amount" value="Concession Amount" />
                                    <TextInput
                                        id="concession_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.concession_amount}
                                        onChange={(e) => setData('concession_amount', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.concession_amount} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="paid_amount" value="Paid Amount" />
                                    <TextInput
                                        id="paid_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.paid_amount}
                                        onChange={(e) => setData('paid_amount', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.paid_amount} className="mt-2" />
                                </div>
                            </div>

                            <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                                <p className="font-medium text-indigo-700 dark:text-indigo-300">
                                    Balance: Rs {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Balance = Total − Concession − Paid. Set to 0 when fully settled.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
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
                                <InputLabel htmlFor="fee_structure_id" value="Fee Structure" />
                                <select
                                    id="fee_structure_id"
                                    value={data.fee_structure_id}
                                    onChange={handleStructureChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                >
                                    <option value="">Select fee structure…</option>
                                    {(feeStructures ?? []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} — {s.academic_session?.name} / {s.school_class?.name} (Rs {Number(s.amount).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.fee_structure_id} className="mt-2" />
                            </div>

                            {selectedStructure && (
                                <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                                    <p className="font-medium text-indigo-700 dark:text-indigo-300">Invoice Summary</p>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                        Amount: <span className="font-semibold">Rs {Number(selectedStructure.amount).toLocaleString()}</span>
                                        {' · '}Session: {selectedStructure.academic_session?.name}
                                        {' · '}Class: {selectedStructure.school_class?.name}
                                    </p>
                                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                                        Concessions (if any) will be auto-applied based on the student's active concessions.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="issue_date" value="Issue Date" />
                            <TextInput
                                id="issue_date"
                                type="date"
                                value={data.issue_date}
                                onChange={(e) => setData('issue_date', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.issue_date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="due_date" value="Due Date" />
                            <TextInput
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.due_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Invoice' : 'Create Invoice'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
