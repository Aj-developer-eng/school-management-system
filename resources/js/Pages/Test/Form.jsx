import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ test, assignments, testTypes }) {
    const isEdit = Boolean(test);
    const { data, setData, post, put, processing, errors } = useForm({
        teacher_subject_assignment_id: test?.teacher_subject_assignment_id ?? '',
        title: test?.title ?? '',
        test_type: test?.test_type?.value ?? test?.test_type ?? '',
        test_date: test?.test_date ?? '',
        total_marks: test?.total_marks ?? 100,
        passing_marks: test?.passing_marks ?? 33,
        description: test?.description ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('tests.update', test.id));
        } else {
            post(route('tests.store'));
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Test' : 'New Test'}
            breadcrumbs={[
                { label: 'Tests', href: route('tests.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Test' : 'New Test'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="teacher_subject_assignment_id" value="Class / Section / Subject" />
                        <select
                            id="teacher_subject_assignment_id"
                            value={data.teacher_subject_assignment_id}
                            onChange={(e) => setData('teacher_subject_assignment_id', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">Select assignment…</option>
                            {(assignments ?? []).map((a) => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                            ))}
                        </select>
                        <InputError message={errors.teacher_subject_assignment_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="title" value="Test Title" />
                        <TextInput
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Chapter 5 Quiz"
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="test_type" value="Test Type" />
                            <select
                                id="test_type"
                                value={data.test_type}
                                onChange={(e) => setData('test_type', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">Select type…</option>
                                {(testTypes ?? []).map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.test_type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="test_date" value="Test Date" />
                            <TextInput
                                id="test_date"
                                type="date"
                                value={data.test_date}
                                onChange={(e) => setData('test_date', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.test_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="total_marks" value="Total Marks" />
                            <TextInput
                                id="total_marks"
                                type="number"
                                step="0.01"
                                min="1"
                                value={data.total_marks}
                                onChange={(e) => setData('total_marks', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.total_marks} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="passing_marks" value="Passing Marks" />
                            <TextInput
                                id="passing_marks"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.passing_marks}
                                onChange={(e) => setData('passing_marks', e.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.passing_marks} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Description / Syllabus (optional)" />
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Test' : 'Announce Test'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
