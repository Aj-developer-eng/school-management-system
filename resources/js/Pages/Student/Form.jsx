import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Form({ student, sessions, classes, sections, subjects = [], selected_subject_ids = [], default_session_id }) {
    const isEdit = Boolean(student);
    const enrollment = student?.enrollments?.[0];

    // Date-cast fields arrive from the backend as ISO-8601 strings
    // (e.g. "1986-05-13T00:00:00.000000Z"), which native date inputs
    // reject — normalize them to YYYY-MM-DD so the form pre-fills.
    const toInputDate = (value) => (value ? String(value).slice(0, 10) : '');

    const { data, setData, post, put, processing, errors } = useForm({
        name: student?.user?.name ?? '',
        email: student?.user?.email ?? '',
        phone: student?.user?.phone ?? '',
        admission_date: toInputDate(student?.admission_date) || new Date().toISOString().slice(0, 10),
        date_of_birth: toInputDate(student?.date_of_birth),
        gender: student?.gender ?? '',
        blood_group: student?.blood_group ?? '',
        religion: student?.religion ?? '',
        nationality: student?.nationality ?? 'Pakistani',
        cnic_bform: student?.cnic_bform ?? '',
        address: student?.address ?? '',
        previous_school: student?.previous_school ?? '',
        medical_notes: student?.medical_notes ?? '',
        academic_session_id: enrollment?.academic_session_id ?? default_session_id ?? '',
        school_class_id: enrollment?.school_class_id ?? '',
        section_id: enrollment?.section_id ?? '',
        roll_number: enrollment?.roll_number ?? '',
        enrolled_on: toInputDate(enrollment?.enrolled_on) || new Date().toISOString().slice(0, 10),
        subject_ids: selected_subject_ids ?? [],
    });

    const [filteredSections, setFilteredSections] = useState([]);

    useEffect(() => {
        const filtered = sections.filter(
            (section) =>
                String(section.academic_session_id) === String(data.academic_session_id) &&
                String(section.school_class_id) === String(data.school_class_id),
        );
        setFilteredSections(filtered);

        // Section is optional: clear it when it is no longer valid for the
        // selected session/class instead of force-selecting the first one.
        const stillValid = filtered.some((s) => String(s.id) === String(data.section_id));
        if (!stillValid) {
            setData('section_id', '');
        }
    }, [data.academic_session_id, data.school_class_id, sections]);

    const selectedSubjectIds = data.subject_ids ?? [];

    // Subjects mapped to the selected class; subjects that are already selected
    // stay visible even when they are not mapped to that class.
    const subjectOptions = subjects.filter((subject) => {
        if (!data.school_class_id || selectedSubjectIds.includes(subject.id)) {
            return true;
        }

        return subject.school_class_ids.some((id) => String(id) === String(data.school_class_id));
    });

    const subjectsForClass = (classId) =>
        subjects.filter((subject) => subject.school_class_ids.some((id) => String(id) === String(classId)));

    const toggleSubject = (subjectId) => {
        setData(
            'subject_ids',
            selectedSubjectIds.includes(subjectId)
                ? selectedSubjectIds.filter((id) => id !== subjectId)
                : [...selectedSubjectIds, subjectId],
        );
    };

    // Choosing a class pre-selects that class's subjects (its default
    // curriculum); the selection stays editable afterwards.
    const changeClass = (classId) => {
        setData('school_class_id', classId);
        setData('subject_ids', subjectsForClass(classId).map((subject) => subject.id));
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('students.update', student.id));
        } else {
            post(route('students.store'));
        }
    };

    const selectClass =
        'mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200';

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Student' : 'Admit Student'}
            breadcrumbs={[
                { label: 'Students', href: route('students.index') },
                { label: isEdit ? 'Edit' : 'Admit' },
            ]}
        >
            <Head title={isEdit ? 'Edit Student' : 'Admit Student'} />

            <Card className="max-w-4xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Full Name" required />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Phone" required />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="admission_date" value="Admission Date" required />
                            <TextInput
                                id="admission_date"
                                type="date"
                                value={data.admission_date}
                                onChange={(event) => setData('admission_date', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.admission_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="date_of_birth" value="Date of Birth" required/>
                            <TextInput
                                id="date_of_birth"
                                type="date"
                                value={data.date_of_birth}
                                onChange={(event) => setData('date_of_birth', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.date_of_birth} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="gender" value="Gender" required/>
                            <select
                                id="gender"
                                value={data.gender}
                                onChange={(event) => setData('gender', event.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">—</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <InputError message={errors.gender} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="blood_group" value="Blood Group" />
                            <TextInput
                                id="blood_group"
                                value={data.blood_group}
                                onChange={(event) => setData('blood_group', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.blood_group} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="religion" value="Religion" />
                            <TextInput
                                id="religion"
                                value={data.religion}
                                onChange={(event) => setData('religion', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.religion} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="nationality" value="Nationality" />
                            <TextInput
                                id="nationality"
                                value={data.nationality}
                                onChange={(event) => setData('nationality', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.nationality} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="cnic_bform" value="CNIC / B-Form" required/>
                            <TextInput
                                id="cnic_bform"
                                value={data.cnic_bform}
                                onChange={(event) => setData('cnic_bform', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.cnic_bform} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Address" required/>
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(event) => setData('address', event.target.value)}
                            rows={3}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="previous_school" value="Previous School" />
                            <TextInput
                                id="previous_school"
                                value={data.previous_school}
                                onChange={(event) => setData('previous_school', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.previous_school} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="medical_notes" value="Medical Notes" required/>
                            <TextInput
                                id="medical_notes"
                                value={data.medical_notes}
                                onChange={(event) => setData('medical_notes', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.medical_notes} className="mt-2" />
                        </div>
                    </div>

                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Enrollment
                    </h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="academic_session_id" value="Academic Session" required />
                            <select
                                id="academic_session_id"
                                value={data.academic_session_id}
                                onChange={(event) => setData('academic_session_id', event.target.value)}
                                className={selectClass}
                                required
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
                            <InputLabel htmlFor="school_class_id" value="Class" required />
                            <select
                                id="school_class_id"
                                value={data.school_class_id}
                                onChange={(event) => changeClass(event.target.value)}
                                className={selectClass}
                                required
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
                            <InputLabel htmlFor="section_id" value="Section" required />
                            <select
                                id="section_id"
                                value={data.section_id}
                                onChange={(event) => setData('section_id', event.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">Select section</option>
                                {filteredSections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.section_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="roll_number" value="Roll Number" required/>
                            <TextInput
                                id="roll_number"
                                value={data.roll_number}
                                onChange={(event) => setData('roll_number', event.target.value)}
                                className="mt-1 block w-full"
                                required
                            />
                            <InputError message={errors.roll_number} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="enrolled_on" value="Enrolled On" />
                        <TextInput
                            id="enrolled_on"
                            type="date"
                            value={data.enrolled_on}
                            onChange={(event) => setData('enrolled_on', event.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={errors.enrolled_on} className="mt-2" />
                    </div>

                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Subjects
                    </h3>

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <InputLabel htmlFor="subjects" value="Subjects" />
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {selectedSubjectIds.length} selected
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setData('subject_ids', subjectOptions.map((subject) => subject.id))}
                                    className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('subject_ids', [])}
                                    className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {data.school_class_id
                                ? 'Subjects mapped to the selected class are checked by default — uncheck any that do not apply.'
                                : 'Select a class to load its subjects, or pick from all active subjects below.'}
                        </p>

                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {subjectOptions.map((subject) => {
                                const checked = selectedSubjectIds.includes(subject.id);
                                return (
                                    <label
                                        key={subject.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                                            checked
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            value={subject.id}
                                            checked={checked}
                                            onChange={() => toggleSubject(subject.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <span className="truncate">
                                            {subject.name}
                                            {subject.code ? (
                                                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({subject.code})</span>
                                            ) : null}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {subjectOptions.length === 0 && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {subjects.length === 0
                                    ? 'No active subjects available.'
                                    : 'No subjects are mapped to the selected class yet.'}
                            </p>
                        )}
                        <InputError message={errors.subject_ids ?? errors['subject_ids.0']} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Student' : 'Admit Student'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
