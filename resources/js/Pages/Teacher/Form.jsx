import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Upload, X, User } from 'lucide-react';

export default function Form({ teacher }) {
    const isEdit = Boolean(teacher);
    const fileInputRef = useRef(null);
    const [photoPreview, setPhotoPreview] = useState(teacher?.photo_url ?? null);
    const { data, setData, post, put, processing, errors } = useForm({
        name: teacher?.user?.name ?? '',
        email: teacher?.user?.email ?? '',
        phone: teacher?.user?.phone ?? '',
        password: '',
        password_confirmation: '',
        employee_code: teacher?.employee_code ?? '',
        qualification: teacher?.qualification ?? '',
        joining_date: teacher?.joining_date ?? '',
        bio: teacher?.bio ?? '',
        is_active: teacher?.is_active ?? true,
        photo: null,
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('photo', file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handlePhotoRemove = () => {
        setData('photo', null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('teachers.update', teacher.id), {
                preserveScroll: true,
            });
        } else {
            post(route('teachers.store'), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Teacher' : 'New Teacher'}
            breadcrumbs={[
                { label: 'Teachers', href: route('teachers.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit Teacher' : 'New Teacher'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    {/* Photo Upload */}
                    <div>
                        <InputLabel htmlFor="photo" value="Profile Photo" />
                        <div className="mt-2 flex items-center gap-5">
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                        <User className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileInputRef}
                                    id="photo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Photo
                                </button>
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={handlePhotoRemove}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                        Remove
                                    </button>
                                )}
                                <p className="text-xs text-gray-500">JPG, PNG, or WebP. Max 2MB.</p>
                            </div>
                        </div>
                        <InputError message={errors.photo} className="mt-2" />
                    </div>

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
                            <InputLabel htmlFor="employee_code" value="Employee Code" />
                            <TextInput
                                id="employee_code"
                                value={data.employee_code}
                                onChange={(event) => setData('employee_code', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.employee_code} className="mt-2" />
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
                            <InputLabel htmlFor="qualification" value="Qualification" />
                            <TextInput
                                id="qualification"
                                value={data.qualification}
                                onChange={(event) => setData('qualification', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.qualification} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="joining_date" value="Joining Date" />
                            <TextInput
                                id="joining_date"
                                type="date"
                                value={data.joining_date}
                                onChange={(event) => setData('joining_date', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.joining_date} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="bio" value="Bio" />
                        <textarea
                            id="bio"
                            value={data.bio}
                            onChange={(event) => setData('bio', event.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                        <InputError message={errors.bio} className="mt-2" />
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
                            {isEdit ? 'Update Teacher' : 'Create Teacher'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
