import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
    'mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 disabled:cursor-not-allowed disabled:opacity-60';

export default function Form({ class: item, sessions, teachers, can_assign, assignments }) {
    const isEdit = Boolean(item);

    // `sessions` arrives as an id => name map, so it is turned into a list of
    // [id, name] pairs the select can iterate over.
    const sessionOptions = Object.entries(sessions ?? {});

    // The class's existing assignments. On edit the user picks which of them
    // to change; the chosen one is pre-filled into the assignment fields and
    // its id is sent back, so the very same row is updated instead of a new
    // one being created next to it.
    const classAssignments = assignments ?? [];

    const [selectedAssignmentId, setSelectedAssignmentId] = useState(
        classAssignments[0]?.id ?? null,
    );

    const selectedAssignment =
        classAssignments.find((assignment) => assignment.id === selectedAssignmentId) ??
        classAssignments[0] ??
        null;

    // The session is no longer picked in the browser: an existing assignment
    // keeps the session it already belongs to and a brand new one falls back
    // to the active academic session, which is resolved on the server.
    const defaultAssignment = selectedAssignment
        ? {
              id: selectedAssignment.id,
              teacher_id: selectedAssignment.teacher_id ?? '',
              start_time: selectedAssignment.start_time ?? '',
              end_time: selectedAssignment.end_time ?? '',
              days_of_week: selectedAssignment.days_of_week ?? [],
          }
        : {
              id: '',
              teacher_id: '',
              start_time: '',
              end_time: '',
              days_of_week: [],
          };

    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name ?? '',
        code: item?.code ?? '',
        description: item?.description ?? '',
        active_from_session_id: item?.active_from_session_id ?? '',
        is_active: item?.is_active ?? true,
        assignment: {
            id: defaultAssignment.id,
            teacher_id: defaultAssignment.teacher_id,
            start_time: defaultAssignment.start_time,
            end_time: defaultAssignment.end_time,
            days_of_week: defaultAssignment.days_of_week,
        },
    });

    // Switching to another existing assignment replaces the fields with that
    // assignment's own details.
    const selectAssignment = (assignmentId) => {
        setSelectedAssignmentId(assignmentId);

        const assignment = classAssignments.find((entry) => entry.id === assignmentId);

        if (!assignment) {
            return;
        }

        setData('assignment', {
            id: assignment.id,
            teacher_id: assignment.teacher_id ?? '',
            start_time: assignment.start_time ?? '',
            end_time: assignment.end_time ?? '',
            days_of_week: assignment.days_of_week ?? [],
        });
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('classes.update', item.id));
        } else {
            post(route('classes.store'));
        }
    };

    // The optional class-assignment section is shown for both create and edit
    // whenever the user may manage teacher assignments, so an existing class
    // can be updated with its teacher and weekly schedule.
    const showAssignment = can_assign && (teachers?.length ?? 0) > 0;
    const hasAssignmentTeacher = Boolean(data.assignment.teacher_id);

    // Collapsed by default: the class form stays focused and the optional
    // assignment fields are only shown when the user clicks the header.
    // Auto-open when the submitted assignment came back with validation
    // errors, otherwise the error messages would stay hidden while collapsed.
    const hasAssignmentErrors = Object.keys(errors).some((key) => key.startsWith('assignment.'));
    const [assignmentOpen, setAssignmentOpen] = useState(hasAssignmentErrors);

    const toggleDay = (value) => {
        const current = data.assignment.days_of_week ?? [];
        setData(
            'assignment.days_of_week',
            current.includes(value) ? current.filter((day) => day !== value) : [...current, value],
        );
    };

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

                    <div>
                        <InputLabel htmlFor="active_from_session_id" value="Introduced In Session" />
                        <select
                            id="active_from_session_id"
                            value={data.active_from_session_id}
                            onChange={(event) => setData('active_from_session_id', event.target.value)}
                            className={selectClass}
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
                            <button
                                type="button"
                                onClick={() => setAssignmentOpen((open) => !open)}
                                aria-expanded={assignmentOpen}
                                aria-controls={assignmentOpen ? 'class-assignment-fields' : undefined}
                                className="flex w-full items-start justify-between gap-3 text-left"
                            >
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Class Assignment
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                        {assignmentOpen
                                            ? 'Same as Teacher Assignments — an existing assignment keeps its academic session, a new one uses the active session. Leave the teacher empty to skip.'
                                            : 'Click to show the optional teacher assignment fields.'}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`mt-0.5 shrink-0 text-gray-400 transition-transform ${
                                        assignmentOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {assignmentOpen && (
                            <div id="class-assignment-fields" className="mt-4 space-y-6">
                                {isEdit && classAssignments.length > 0 && (
                                    <div>
                                        <InputLabel htmlFor="assignment_picker" value="Existing Assignment" />
                                        <select
                                            id="assignment_picker"
                                            value={data.assignment.id ?? ''}
                                            onChange={(event) => selectAssignment(Number(event.target.value))}
                                            className={selectClass}
                                        >
                                            {classAssignments.map((assignment) => (
                                                <option key={assignment.id} value={assignment.id}>
                                                    {assignment.teacher_name} · {assignment.session_name}
                                                    {assignment.start_time ? ` · ${assignment.start_time}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            The selected assignment is updated in place — no duplicate is created.
                                        </p>
                                        <InputError message={errors['assignment.id']} className="mt-2" />
                                    </div>
                                )}

                                <div>
                                    <InputLabel htmlFor="assignment_teacher_id" value="Teacher" />
                                    <select
                                        id="assignment_teacher_id"
                                        value={data.assignment.teacher_id}
                                        onChange={(event) => setData('assignment.teacher_id', event.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="">— No teacher assignment —</option>
                                        {teachers?.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors['assignment.teacher_id']} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="assignment_start_time" value="Class Start Time" />
                                        <TextInput
                                            id="assignment_start_time"
                                            type="time"
                                            value={data.assignment.start_time}
                                            onChange={(event) => setData('assignment.start_time', event.target.value)}
                                            disabled={!hasAssignmentTeacher}
                                            className="mt-1 block w-full disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                        <InputError message={errors['assignment.start_time']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="assignment_end_time" value="Class End Time" />
                                        <TextInput
                                            id="assignment_end_time"
                                            type="time"
                                            value={data.assignment.end_time}
                                            onChange={(event) => setData('assignment.end_time', event.target.value)}
                                            disabled={!hasAssignmentTeacher}
                                            className="mt-1 block w-full disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                        <InputError message={errors['assignment.end_time']} className="mt-2" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <InputLabel value="Days of Week" />
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {dayOptions.map((day) => {
                                                const selected = (data.assignment.days_of_week ?? []).includes(
                                                    day.value,
                                                );
                                                return (
                                                    <button
                                                        key={day.value}
                                                        type="button"
                                                        onClick={() => toggleDay(day.value)}
                                                        disabled={!hasAssignmentTeacher}
                                                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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
                                            Select all days this class takes place (leave empty for no fixed days).
                                        </p>
                                        <InputError message={errors['assignment.days_of_week']} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    )}

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
