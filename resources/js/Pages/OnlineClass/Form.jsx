import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Form({ onlineClass, teachers, sessions, classes, subjects, activeSessionId }) {
    const isEdit = Boolean(onlineClass);
    const { data, setData, post, put, processing, errors } = useForm({
        teacher_id: onlineClass?.teacher_id ?? '',
        academic_session_id: onlineClass?.academic_session_id ?? activeSessionId ?? '',
        school_class_id: onlineClass?.school_class_id ?? '',
        section_id: onlineClass?.section_id ?? '',
        subject_id: onlineClass?.subject_id ?? '',
        title: onlineClass?.title ?? '',
        meeting_link: onlineClass?.meeting_link ?? '',
        description: onlineClass?.description ?? '',
        scheduled_at: onlineClass?.scheduled_at ?? '',
    });

    const [sections, setSections] = useState([]);

    const loadSections = (sessionId, classId) => {
        if (!sessionId || !classId) {
            setSections({});
            return;
        }
        fetch(`${route('teacher-assignments.sections')}?academic_session_id=${sessionId}&school_class_id=${classId}`)
            .then((res) => res.json())
            .then(setSections)
            .catch(() => setSections({}));
    };

    const handleClassChange = (e) => {
        const classId = e.target.value;
        setData('school_class_id', classId);
        setData('section_id', '');
        loadSections(data.academic_session_id, classId);
    };

    const handleSessionChange = (e) => {
        const sessionId = e.target.value;
        setData('academic_session_id', sessionId);
        setData('section_id', '');
        loadSections(sessionId, data.school_class_id);
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('online-classes.update', onlineClass.id));
        } else {
            post(route('online-classes.store'));
        }
    };

    const selectClass = 'mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200';

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Online Class' : 'New Online Class'}
            breadcrumbs={[
                { label: 'Online Classes', href: route('online-classes.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Online Class' : 'New Online Class'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <div>
                        <InputLabel htmlFor="title" value="Title / Topic (optional)" />
                        <TextInput
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Math — Chapter 6 Review"
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="meeting_link" value="Zoom / Meeting Link" />
                        <TextInput
                            id="meeting_link"
                            type="url"
                            value={data.meeting_link}
                            onChange={(e) => setData('meeting_link', e.target.value)}
                            placeholder="https://zoom.us/j/..."
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.meeting_link} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="teacher_id" value="Teacher" />
                        <select
                            id="teacher_id"
                            value={data.teacher_id}
                            onChange={(e) => setData('teacher_id', e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Select teacher…</option>
                            {(teachers ?? []).map((t) => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <InputError message={errors.teacher_id} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="academic_session_id" value="Academic Session" />
                            <select
                                id="academic_session_id"
                                value={data.academic_session_id}
                                onChange={handleSessionChange}
                                className={selectClass}
                            >
                                <option value="">Select session…</option>
                                {Object.entries(sessions ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <InputError message={errors.academic_session_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="school_class_id" value="Class" />
                            <select
                                id="school_class_id"
                                value={data.school_class_id}
                                onChange={handleClassChange}
                                className={selectClass}
                            >
                                <option value="">Select class…</option>
                                {Object.entries(classes ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <InputError message={errors.school_class_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="section_id" value="Section (optional)" />
                            <select
                                id="section_id"
                                value={data.section_id}
                                onChange={(e) => setData('section_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Whole class</option>
                                {Object.entries(sections).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <InputError message={errors.section_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="subject_id" value="Subject (optional)" />
                            <select
                                id="subject_id"
                                value={data.subject_id}
                                onChange={(e) => setData('subject_id', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">None</option>
                                {Object.entries(subjects ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                            <InputError message={errors.subject_id} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="scheduled_at" value="Scheduled Date & Time" />
                        <TextInput
                            id="scheduled_at"
                            type="datetime-local"
                            value={data.scheduled_at}
                            onChange={(e) => setData('scheduled_at', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.scheduled_at} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Description / Notes (optional)" />
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
                            {isEdit ? 'Update Online Class' : 'Publish Link'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
