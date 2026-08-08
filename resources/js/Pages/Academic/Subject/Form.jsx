import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ subject, classes }) {
    const isEdit = Boolean(subject);
    const { data, setData, post, put, processing, errors } = useForm({
        name: subject?.name ?? '',
        code: subject?.code ?? '',
        description: subject?.description ?? '',
        school_class_ids: subject?.school_classes?.map((c) => String(c.id)) ?? [],
        is_active: subject?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('subjects.update', subject.id));
        } else {
            post(route('subjects.store'));
        }
    };

    const toggleClass = (id) => {
        const set = new Set(data.school_class_ids);
        const key = String(id);
        if (set.has(key)) {
            set.delete(key);
        } else {
            set.add(key);
        }
        setData('school_class_ids', Array.from(set));
    };

    const classOptions = Object.entries(classes ?? {});

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Subject' : 'New Subject'}
            breadcrumbs={[
                { label: 'Subjects', href: route('subjects.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Subject' : 'New Subject'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Subject Name" />
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

                    <div>
                        <InputLabel htmlFor="classes" value="Assign to Classes" />
                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {classOptions.map(([id, name]) => {
                                const checked = data.school_class_ids.includes(id);
                                return (
                                    <label
                                        key={id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                                            checked
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            value={id}
                                            checked={checked}
                                            onChange={() => toggleClass(id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        {name}
                                    </label>
                                );
                            })}
                        </div>
                        {classOptions.length === 0 && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                No active classes available.
                            </p>
                        )}
                        <InputError message={errors.school_class_ids} className="mt-2" />
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
                            {isEdit ? 'Update Subject' : 'Create Subject'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
