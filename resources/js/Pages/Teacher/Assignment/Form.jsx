import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Form({ assignment, teachers, sessions, classes }) {
    const isEdit = Boolean(assignment);
    const { data, setData, post, put, processing, errors } = useForm({
        teacher_id: assignment?.teacher_id ?? '',
        academic_session_id: assignment?.academic_session_id ?? '',
        school_class_id: assignment?.school_class_id ?? '',
        section_id: assignment?.section_id ?? '',
        subject_id: assignment?.subject_id ?? '',
    });

    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        if (data.academic_session_id && data.school_class_id) {
            fetch(
                `${route('teacher-assignments.sections')}?academic_session_id=${data.academic_session_id}&school_class_id=${data.school_class_id}`,
            )
                .then((res) => res.json())
                .then((json) => setSections(Object.entries(json).map(([id, name]) => ({ id, name }))));
        } else {
            setSections([]);
        }
    }, [data.academic_session_id, data.school_class_id]);

    useEffect(() => {
        if (data.school_class_id) {
            fetch(`${route('teacher-assignments.subjects')}?school_class_id=${data.school_class_id}`)
                .then((res) => res.json())
                .then((json) => setSubjects(Object.entries(json).map(([id, name]) => ({ id, name }))));
        } else {
            setSubjects([]);
        }
    }, [data.school_class_id]);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('teacher-assignments.update', assignment.id));
        } else {
            post(route('teacher-assignments.store'));
        }
    };

    const selectClass =
        'mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200';

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Assignment' : 'New Assignment'}
            breadcrumbs={[
                { label: 'Teacher Assignments', href: route('teacher-assignments.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Assignment' : 'New Assignment'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
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
                                onChange={(event) => setData('academic_session_id', event.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select session</option>
                                {Object.entries(sessions ?? {}).map(([id, name]) => (
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
                                className={selectClass}
                            >
                                <option value="">Select class</option>
                                {Object.entries(classes ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.school_class_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="section_id" value="Section" />
                            <select
                                id="section_id"
                                value={data.section_id}
                                onChange={(event) => setData('section_id', event.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select section</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.section_id} className="mt-2" />
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
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.subject_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Assignment' : 'Create Assignment'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
