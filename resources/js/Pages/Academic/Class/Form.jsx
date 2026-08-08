import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ class: item, sessions }) {
    const isEdit = Boolean(item);
    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name ?? '',
        code: item?.code ?? '',
        level: item?.level ?? '',
        description: item?.description ?? '',
        active_from_session_id: item?.active_from_session_id ?? '',
        is_active: item?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('classes.update', item.id));
        } else {
            post(route('classes.store'));
        }
    };

    const sessionOptions = Object.entries(sessions ?? {});

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Class' : 'New Class'}
            breadcrumbs={[
                { label: 'Classes', href: route('classes.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Class' : 'New Class'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Class Name" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="code" value="Code" />
                            <TextInput
                                id="code"
                                value={data.code}
                                onChange={(event) => setData('code', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.code} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="level" value="Level (sort order)" />
                            <TextInput
                                id="level"
                                type="number"
                                value={data.level}
                                onChange={(event) => setData('level', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.level} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="active_from_session_id" value="Introduced In Session" />
                            <select
                                id="active_from_session_id"
                                value={data.active_from_session_id}
                                onChange={(event) => setData('active_from_session_id', event.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">—</option>
                                {sessionOptions.map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.active_from_session_id} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Description" />
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <InputLabel htmlFor="is_active" value="Active" />
                    </div>
                    <InputError message={errors.is_active} className="mt-2" />

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Class' : 'Create Class'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
