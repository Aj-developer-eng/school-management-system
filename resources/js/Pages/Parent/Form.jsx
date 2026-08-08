import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';

export default function Form({ parent, students }) {
    const isEdit = Boolean(parent);
    const { data, setData, post, put, processing, errors } = useForm({
        name: parent?.user?.name ?? '',
        email: parent?.user?.email ?? '',
        phone: parent?.user?.phone ?? '',
        password: '',
        password_confirmation: '',
        occupation: parent?.occupation ?? '',
        cnic: parent?.cnic ?? '',
        emergency_contact: parent?.emergency_contact ?? '',
        address: parent?.address ?? '',
        is_active: parent?.is_active ?? true,
        students: parent?.students ?? [],
    });

    const addStudent = () => {
        setData('students', [...data.students, { student_id: '', guardian_type: 'Father', is_primary_contact: false }]);
    };

    const removeStudent = (index) => {
        const list = [...data.students];
        list.splice(index, 1);
        setData('students', list);
    };

    const updateStudent = (index, key, value) => {
        const list = [...data.students];
        list[index] = { ...list[index], [key]: value };
        setData('students', list);
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('parents.update', parent.id));
        } else {
            post(route('parents.store'));
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Parent' : 'New Parent'}
            breadcrumbs={[
                { label: 'Parents', href: route('parents.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Parent' : 'New Parent'} />

            <Card className="max-w-3xl">
                <form onSubmit={submit} className="space-y-6 p-6">
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
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                            <InputLabel htmlFor="cnic" value="CNIC" />
                            <TextInput
                                id="cnic"
                                value={data.cnic}
                                onChange={(event) => setData('cnic', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.cnic} className="mt-2" />
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(event) => setData('password', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(event) => setData('password_confirmation', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>
                        </div>
                    )}

                    {isEdit && (
                        <div>
                            <InputLabel htmlFor="password" value="New Password (leave blank to keep current)" />
                            <TextInput
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="occupation" value="Occupation" />
                            <TextInput
                                id="occupation"
                                value={data.occupation}
                                onChange={(event) => setData('occupation', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.occupation} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="emergency_contact" value="Emergency Contact" />
                            <TextInput
                                id="emergency_contact"
                                value={data.emergency_contact}
                                onChange={(event) => setData('emergency_contact', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.emergency_contact} className="mt-2" />
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

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Linked Children
                        </h3>

                        {data.students.map((row, index) => (
                            <div key={index} className="mt-3 grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:grid-cols-4">
                                <div>
                                    <InputLabel htmlFor={`student-${index}`} value="Student" />
                                    <select
                                        id={`student-${index}`}
                                        value={row.student_id}
                                        onChange={(event) => updateStudent(index, 'student_id', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                    >
                                        <option value="">Select student</option>
                                        {students.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <InputLabel htmlFor={`guardian-${index}`} value="Guardian Type" />
                                    <select
                                        id={`guardian-${index}`}
                                        value={row.guardian_type}
                                        onChange={(event) => updateStudent(index, 'guardian_type', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                    >
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id={`primary-${index}`}
                                        type="checkbox"
                                        checked={row.is_primary_contact}
                                        onChange={(event) => updateStudent(index, 'is_primary_contact', event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                    />
                                    <InputLabel htmlFor={`primary-${index}`} value="Primary Contact" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeStudent(index)}
                                    className="inline-flex items-center justify-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400"
                                >
                                    <Trash2 size={16} /> Remove
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addStudent}
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                        >
                            <Plus size={16} /> Add Child
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update Parent' : 'Create Parent'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
