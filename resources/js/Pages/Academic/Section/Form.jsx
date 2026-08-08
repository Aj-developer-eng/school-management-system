import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ section, sessions, classes }) {
    const isEdit = Boolean(section);
    const { data, setData, post, put, processing, errors } = useForm({
        name: section?.name ?? '',
        capacity: section?.capacity ?? '',
        school_class_id: section?.school_class_id ?? '',
        academic_session_id: section?.academic_session_id ?? '',
        room_number: section?.room_number ?? '',
        is_active: section?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('sections.update', section.id));
        } else {
            post(route('sections.store'));
        }
    };

    const sessionOptions = Object.entries(sessions ?? {});
    const classOptions = Object.entries(classes ?? {});

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Section' : 'New Section'}
            breadcrumbs={[
                { label: 'Sections', href: route('sections.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Section' : 'New Section'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Section Name" />
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
                            <InputLabel htmlFor="capacity" value="Capacity" />
                            <TextInput
                                id="capacity"
                                type="number"
                                value={data.capacity}
                                onChange={(event) => setData('capacity', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.capacity} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="academic_session_id" value="Academic Session" />
                            <select
                                id="academic_session_id"
                                value={data.academic_session_id}
                                onChange={(event) => setData('academic_session_id', event.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select session</option>
                                {sessionOptions.map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
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
                                onChange={(event) => setData('school_class_id', event.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select class</option>
                                {classOptions.map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.school_class_id} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="room_number" value="Room Number" />
                        <TextInput
                            id="room_number"
                            value={data.room_number}
                            onChange={(event) => setData('room_number', event.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.room_number} className="mt-2" />
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
                            {isEdit ? 'Update Section' : 'Create Section'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
