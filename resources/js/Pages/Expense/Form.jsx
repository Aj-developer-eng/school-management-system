import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ expense, categories }) {
    const isEdit = Boolean(expense);
    const { data, setData, post, put, processing, errors } = useForm({
        title: expense?.title ?? '',
        category: expense?.category ?? 'general',
        amount: expense?.amount ?? '',
        expense_date: expense?.expense_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        notes: expense?.notes ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('expenses.update', expense.id));
        } else {
            post(route('expenses.store'));
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Expense' : 'New Expense'}
            breadcrumbs={[
                { label: 'Expenses', href: route('expenses.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Expense' : 'New Expense'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="title" value="Title" />
                        <TextInput
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Electricity bill"
                            className="mt-1 block w-full"
                            isFocused
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="category" value="Category" />
                            <select
                                id="category"
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                {Object.entries(categories ?? {}).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            <InputError message={errors.category} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="amount" value="Amount" />
                            <TextInput
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.amount} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="expense_date" value="Date" />
                        <TextInput
                            id="expense_date"
                            type="date"
                            value={data.expense_date}
                            onChange={(e) => setData('expense_date', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.expense_date} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="notes" value="Notes (optional)" />
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.notes} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Expense' : 'Record Expense'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}