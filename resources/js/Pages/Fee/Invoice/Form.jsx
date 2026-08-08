import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Form({ students, feeStructures }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        fee_structure_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
    });

    const [selectedStructure, setSelectedStructure] = useState(null);

    const handleStructureChange = (e) => {
        const id = e.target.value;
        setData('fee_structure_id', id);
        const structure = feeStructures?.find((s) => String(s.id) === id);
        setSelectedStructure(structure ?? null);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('fee-invoices.store'));
    };

    return (
        <AuthenticatedLayout
            title="New Invoice"
            breadcrumbs={[
                { label: 'Fee Invoices', href: route('fee-invoices.index') },
                { label: 'New' },
            ]}
        >
            <Head title="New Invoice" />

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
                            Create Invoice
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
