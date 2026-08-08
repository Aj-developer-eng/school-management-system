import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ session }) {
    const isEdit = Boolean(session);
    const { data, setData, post, put, processing, errors } = useForm({
        name: session?.name ?? '',
        start_date: session?.start_date ?? '',
        end_date: session?.end_date ?? '',
        is_active: session?.is_active ?? false,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('academic-sessions.update', session.id));
        } else {
            post(route('academic-sessions.store'));
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Academic Session' : 'New Academic Session'}
            breadcrumbs={[
                { label: 'Academic Sessions', href: route('academic-sessions.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Academic Session' : 'New Academic Session'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="name" value="Session Name" />
                        <TextInput
                            id="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="mt-1 block w-full"
                            isFocused
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="start_date" value="Start Date" />
                            <TextInput
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) => setData('start_date', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.start_date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="end_date" value="End Date" />
                            <TextInput
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(event) => setData('end_date', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.end_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <InputLabel htmlFor="is_active" value="Set as active session" />
                    </div>
                    <InputError message={errors.is_active} className="mt-2" />

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Session' : 'Create Session'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
