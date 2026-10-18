import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

const dayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
];

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200';

export default function Form({
    class: item,
    sessions,
    teachers,
    subjects,
    active_session_id,
    can_create_assignment,
}) {
    const isEdit = Boolean(item);
    const showAssignment = !isEdit && Boolean(can_create_assignment);

    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name ?? '',
        code: item?.code ?? '',
        description: item?.description ?? '',
        active_from_session_id: item?.active_from_session_id ?? '',
        is_active: item?.is_active ?? true,
        create_assignment: false,
        teacher_id: '',
        academic_session_id: active_session_id ?? '',
        subject_id: '',
        start_time: '',
        end_time: '',
        days_of_week: [],
    });

    const toggleDay = (value) => {
        const current = data.days_of_week ?? [];
        setData(
            'days_of_week',
            current.includes(value) ? current.filter((day) => day !== value) : [...current, value],
        );
    };

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
                        <div className={isEdit ? '' : 'sm:col-span-2'}>
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

                        {isEdit && (
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
                        )}
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

                    {showAssignment && (
                        <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                        Class Assignment
                                    </h3>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Optionally assign a teacher to a subject for this class while creating
                                        it — same as a Subject Assignment.
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <input
                                        id="create_assignment"
                                        type="checkbox"
                                        checked={data.create_assignment}
                                        onChange={(event) =>
                                            setData('create_assignment', event.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <InputLabel htmlFor="create_assignment" value="Add assignment" />
                                </div>
                            </div>

                            {data.create_assignment && (
                                <div className="mt-6 space-y-6">
                                    <div>
                                        <InputLabel htmlFor="teacher_id" value="Teacher" />
                                        <select
                                            id="teacher_id"
                                            value={data.teacher_id}
                                            onChange={(event) => setData('teacher_id', event.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="">Select teacher</option>
                                            {teachers?.map((teacher) => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.teacher_id} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="academic_session_id" value="Academic Session" />
                                            <select
                                                id="academic_session_id"
                                                value={data.academic_session_id}
                                                onChange={(event) =>
                                                    setData('academic_session_id', event.target.value)
                                                }
                                                className={selectClass}
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
                                            <InputLabel htmlFor="subject_id" value="Subject" />
                                            <select
                                                id="subject_id"
                                                value={data.subject_id}
                                                onChange={(event) => setData('subject_id', event.target.value)}
                                                className={selectClass}
                                            >
                                                <option value="">Select subject</option>
                                                {Object.entries(subjects ?? {}).map(([id, name]) => (
                                                    <option key={id} value={id}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.subject_id} className="mt-2" />
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Sections are created after the class, so no section is picked here. The
                                        subject you select is linked to this class automatically — edit the
                                        assignment later under Subject Assignments to pick a section.
                                    </p>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="start_time" value="Class Start Time" />
                                            <TextInput
                                                id="start_time"
                                                type="time"
                                                value={data.start_time}
                                                onChange={(event) => setData('start_time', event.target.value)}
                                                className="mt-1 block w-full"
                                            />
                                            <InputError message={errors.start_time} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="end_time" value="Class End Time" />
                                            <TextInput
                                                id="end_time"
                                                type="time"
                                                value={data.end_time}
                                                onChange={(event) => setData('end_time', event.target.value)}
                                                className="mt-1 block w-full"
                                            />
                                            <InputError message={errors.end_time} className="mt-2" />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <InputLabel value="Days of Week" />
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {dayOptions.map((day) => {
                                                    const selected = (data.days_of_week ?? []).includes(day.value);
                                                    return (
                                                        <button
                                                            key={day.value}
                                                            type="button"
                                                            onClick={() => toggleDay(day.value)}
                                                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                                selected
                                                                    ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                                                            }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Select all days this subject takes place (leave empty for no fixed
                                                days).
                                            </p>
                                            <InputError message={errors.days_of_week} className="mt-2" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit
                                ? 'Update Class'
                                : data.create_assignment
                                  ? 'Create Class & Assignment'
                                  : 'Create Class'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
