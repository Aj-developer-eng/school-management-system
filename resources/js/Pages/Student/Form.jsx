import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ student, sessions, classes, selected_class_ids = [], default_session_id }) {
    const isEdit = Boolean(student);
    // Roll number and enrolment date are shared across the student's classes.
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
        academic_session_id: default_session_id ?? '',
        school_class_ids: selected_class_ids ?? [],
        roll_number: enrollment?.roll_number ?? '',
        enrolled_on: toInputDate(enrollment?.enrolled_on) || new Date().toISOString().slice(0, 10),
    });

    const toggleClass = (classId) => {
        const current = data.school_class_ids ?? [];
        const selected = current.some((id) => String(id) === String(classId));

        setData(
            'school_class_ids',
            selected
                ? current.filter((id) => String(id) !== String(classId))
                : [...current, classId],
        );
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
                            <InputLabel htmlFor="academic_session_id" value="Category Session" required />
                            <select
                                id="academic_session_id"
                                value={data.academic_session_id}
                                onChange={(event) => {
                                    setData('academic_session_id', event.target.value);
                                    // Class choices belong to the session — clear
                                    // them when the session changes.
                                    setData('school_class_ids', []);
                                }}
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
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <InputLabel htmlFor="school_class_ids" value="Classes" required />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {data.school_class_ids?.length ?? 0} selected
                            </span>
                        </div>
                        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(classes ?? {}).map(([id, name]) => {
                                const checked = (data.school_class_ids ?? []).some(
                                    (classId) => String(classId) === String(id),
                                );
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
                                        <span className="truncate">{name}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            A student can attend more than one class — tick every class they sit in for this session.
                        </p>
                        <InputError message={errors.school_class_ids ?? errors['school_class_ids.0']} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
