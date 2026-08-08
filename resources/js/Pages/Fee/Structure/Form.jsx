import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

const feeTypes = ['admission', 'monthly', 'exam', 'transport', 'miscellaneous'];
const frequencies = ['one_time', 'monthly', 'quarterly', 'annually'];

export default function Form({ feeStructure, academicSessions, classes }) {
    const isEdit = Boolean(feeStructure);
    const { data, setData, post, put, processing, errors } = useForm({
        academic_session_id: feeStructure?.academic_session_id ?? '',
        school_class_id: feeStructure?.school_class_id ?? '',
        name: feeStructure?.name ?? '',
        fee_type: feeStructure?.fee_type ?? 'monthly',
        amount: feeStructure?.amount ?? '',
        frequency: feeStructure?.frequency ?? 'monthly',
        due_day: feeStructure?.due_day ?? '',
        is_active: feeStructure?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('fee-structures.update', feeStructure.id));
        } else {
            post(route('fee-structures.store'));
        }
    };

    const activeSessions = academicSessions?.filter((s) => s.is_active) ?? academicSessions ?? [];
    const classOptions = Object.entries(classes ?? {});

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Fee Structure' : 'New Fee Structure'}
            breadcrumbs={[
                { label: 'Fee Structures', href: route('fee-structures.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Fee Structure' : 'New Fee Structure'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Fee Name" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="amount" value="Amount (Rs)" />
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.amount} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="academic_session_id" value="Academic Session" />
                            <select
                                id="academic_session_id"
                                value={data.academic_session_id}
                                onChange={(e) => setData('academic_session_id', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select session…</option>
                                {(academicSessions ?? []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}{s.is_active ? ' (Active)' : ''}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.academic_session_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="school_class_id" value="Class" />
                            <select
                                id="school_class_id"
                                value={data.school_class_id}
                                onChange={(e) => setData('school_class_id', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select class…</option>
                                {classOptions.map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <InputError message={errors.school_class_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="fee_type" value="Fee Type" />
                            <select
                                id="fee_type"
                                value={data.fee_type}
                                onChange={(e) => setData('fee_type', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                {feeTypes.map((t) => (
                                    <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                                ))}
                            </select>
                            <InputError message={errors.fee_type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="frequency" value="Frequency" />
                            <select
                                id="frequency"
                                value={data.frequency}
                                onChange={(e) => setData('frequency', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                {frequencies.map((f) => (
                                    <option key={f} value={f}>{f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                                ))}
                            </select>
                            <InputError message={errors.frequency} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="due_day" value="Due Day (1-31, optional)" />
                        <TextInput
                            id="due_day"
                            type="number"
                            min="1"
                            max="31"
                            value={data.due_day}
                            onChange={(e) => setData('due_day', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.due_day} className="mt-2" />
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
                            {isEdit ? 'Update Fee Structure' : 'Create Fee Structure'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
