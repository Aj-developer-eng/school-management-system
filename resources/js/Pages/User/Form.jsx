import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Form({ user, roles }) {
    const isEdit = Boolean(user);
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        password: '',
        password_confirmation: '',
        roles: user?.roles ?? [],
        is_active: user?.is_active ?? true,
    });

    const toggleRole = (role) => {
        const set = new Set(data.roles);
        if (set.has(role)) {
            set.delete(role);
        } else {
            set.add(role);
        }
        setData('roles', Array.from(set));
    };

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(route('users.update', user.id));
        } else {
            post(route('users.store'));
        }
    };

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit User' : 'New User'}
            breadcrumbs={[
                { label: 'Users', href: route('users.index') },
                { label: isEdit ? 'Edit' : 'New' },
            ]}
        >
            <Head title={isEdit ? 'Edit User' : 'New User'} />

            <Card className="max-w-2xl">
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

                        <div className="flex items-center gap-2 pt-6">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) => setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <InputLabel htmlFor="is_active" value="Active" />
                        </div>
                    </div>

                    {!isEdit ? (
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
                    ) : (
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

                    <div>
                        <InputLabel value="Roles" />
                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {roles.map((role) => {
                                const checked = data.roles.includes(role);
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRole(role)}
                                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                                            checked
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={`h-4 w-4 rounded border ${
                                                    checked
                                                        ? 'border-indigo-500 bg-indigo-500'
                                                        : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                                                }`}
                                            />
                                            {role}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.roles} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            {isEdit ? 'Update User' : 'Create User'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
