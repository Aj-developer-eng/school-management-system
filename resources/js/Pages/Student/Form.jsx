import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Form({ student, sessions, classes, sections, default_session_id }) {
    const isEdit = Boolean(student);
    const enrollment = student?.enrollments?.[0];

    const { data, setData, post, put, processing, errors } = useForm({
        name: student?.user?.name ?? '',
        email: student?.user?.email ?? '',
        phone: student?.user?.phone ?? '',
        admission_date: student?.admission_date ?? new Date().toISOString().slice(0, 10),
        date_of_birth: student?.date_of_birth ?? '',
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
        enrolled_on: enrollment?.enrolled_on ?? new Date().toISOString().slice(0, 10),
    });

    const [filteredSections, setFilteredSections] = useState([]);

    useEffect(() => {
        const filtered = sections.filter(
            (section) =>
                String(section.academic_session_id) === String(data.academic_session_id) &&
                String(section.school_class_id) === String(data.school_class_id),
        );
        setFilteredSections(filtered);

        const stillValid = filtered.some((s) => String(s.id) === String(data.section_id));
        if (!stillValid && filtered.length > 0) {
            setData('section_id', filtered[0].id);
        } else if (filtered.length === 0) {
            setData('section_id', '');
        }
    }, [data.academic_session_id, data.school_class_id, sections]);

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
                            <InputLabel htmlFor="name" value="Full Name" />
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
                            <InputLabel htmlFor="phone" value="Phone" />
                            <TextInput
                                id="phone"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="admission_date" value="Admission Date" />
                            <TextInput
                                id="admission_date"
                                type="date"
                                value={data.admission_date}
                                onChange={(event) => setData('admission_date', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.admission_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="date_of_birth" value="Date of Birth" />
                            <TextInput
                                id="date_of_birth"
                                type="date"
                                value={data.date_of_birth}
                                onChange={(event) => setData('date_of_birth', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.date_of_birth} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="gender" value="Gender" />
                            <select
                                id="gender"
                                value={data.gender}
                                onChange={(event) => setData('gender', event.target.value)}
                                className={selectClass}
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
                            <InputLabel htmlFor="cnic_bform" value="CNIC / B-Form" />
                            <TextInput
                                id="cnic_bform"
                                value={data.cnic_bform}
                                onChange={(event) => setData('cnic_bform', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.cnic_bform} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Address" />
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(event) => setData('address', event.target.value)}
                            rows={3}
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
                            <InputLabel htmlFor="medical_notes" value="Medical Notes" />
                            <TextInput
                                id="medical_notes"
                                value={data.medical_notes}
                                onChange={(event) => setData('medical_notes', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.medical_notes} className="mt-2" />
                        </div>
                    </div>

                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Enrollment
                    </h3>

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
                                {filteredSections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.section_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="roll_number" value="Roll Number" />
                            <TextInput
                                id="roll_number"
                                value={data.roll_number}
                                onChange={(event) => setData('roll_number', event.target.value)}
                                className="mt-1 block w-full"
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
