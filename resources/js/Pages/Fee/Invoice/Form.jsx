import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableMultiSelect from '@/Components/Ui/SearchableMultiSelect';
import SearchableSelect from '@/Components/Ui/SearchableSelect';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Form({ students, feeStructures, invoice }) {
    const isEdit = Boolean(invoice);
    const [showCustomAmount, setShowCustomAmount] = useState(false);

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
                  fee_structure_ids: [],
                  custom_amount: '',
                  issue_date: new Date().toISOString().split('T')[0],
                  due_date: '',
              },
    );

    const selectedStructures = (feeStructures ?? []).filter((s) =>
        (data.fee_structure_ids ?? []).includes(String(s.id)),
    );

    const customAmount = Math.max(0, Number(data.custom_amount) || 0);

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
                                    Fee: {invoice.items?.length ? invoice.items.map((item) => item.name).join(', ') : (invoice.fee_structure?.name ?? '—')}
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
                                <SearchableSelect
                                    id="student_id"
                                    value={data.student_id}
                                    onChange={(value) => setData('student_id', value)}
                                    options={students ?? []}
                                    placeholder="Search student by name or admission #…"
                                    emptyMessage="No students match your search"
                                />
                                <InputError message={errors.student_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="fee_structure_ids" value="Fee Structures" />
                                <SearchableMultiSelect
                                    id="fee_structure_ids"
                                    values={data.fee_structure_ids}
                                    onChange={(values) => setData('fee_structure_ids', values)}
                                    options={(feeStructures ?? []).map((s) => ({
                                        value: String(s.id),
                                        label: `${s.name} — ${s.academic_session?.name} / ${s.school_class?.name} (Rs ${Number(s.amount).toLocaleString()})`,
                                        keywords: [s.name, s.academic_session?.name, s.school_class?.name]
                                            .filter(Boolean)
                                            .join(' '),
                                    }))}
                                    placeholder="Search and select fee structures (optional if entering a custom amount)…"
                                    emptyMessage="No fee structures match your search"
                                />
                                <InputError message={errors.fee_structure_ids} className="mt-2" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="show_custom_amount"
                                        type="checkbox"
                                        checked={showCustomAmount}
                                        onChange={(e) => {
                                            setShowCustomAmount(e.target.checked);
                                            if (!e.target.checked) {
                                                setData('custom_amount', '');
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <InputLabel htmlFor="show_custom_amount" value="Add custom amount (one-off charge)" />
                                </div>

                                {showCustomAmount && (
                                    <div className="mt-3">
                                        <InputLabel htmlFor="custom_amount" value="Custom Amount" />
                                        <TextInput
                                            id="custom_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.custom_amount}
                                            onChange={(e) => setData('custom_amount', e.target.value)}
                                            placeholder="e.g. 500"
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.custom_amount} className="mt-2" />
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                A custom amount is billed as a "Custom Fee" line — on its own (leave the fee structures empty) or on top of the selected structures. Concessions are not applied to custom amounts.
                            </p>

                            {selectedStructures.length > 0 || customAmount > 0 ? (
                                <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                                    <p className="font-medium text-indigo-700 dark:text-indigo-300">
                                        Invoice Summary (
                                        {[
                                            selectedStructures.length > 0
                                                ? `${selectedStructures.length} fee structure${selectedStructures.length === 1 ? '' : 's'}`
                                                : null,
                                            customAmount > 0 ? 'custom amount' : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' + ')}
                                        )
                                    </p>
                                    <ul className="mt-1 space-y-1">
                                        {selectedStructures.map((s) => (
                                            <li key={s.id} className="text-gray-600 dark:text-gray-400">
                                                {s.name} · {s.school_class?.name} · {s.academic_session?.name} —{' '}
                                                <span className="font-semibold">Rs {Number(s.amount).toLocaleString()}</span>
                                            </li>
                                        ))}
                                        {customAmount > 0 && (
                                            <li className="text-gray-600 dark:text-gray-400">
                                                Custom Fee —{' '}
                                                <span className="font-semibold">Rs {customAmount.toLocaleString()}</span>
                                            </li>
                                        )}
                                    </ul>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                                        Total:{' '}
                                        <span className="font-semibold">
                                            Rs{' '}
                                            {(
                                                selectedStructures.reduce((sum, s) => sum + Number(s.amount), 0) + customAmount
                                            ).toLocaleString()}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                                        A single invoice will be created for the total of the selected fee structures and custom amount. Concessions (if any) are auto-applied to the selected fee structures only.
                                    </p>
                                </div>
                            ) : null}
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
