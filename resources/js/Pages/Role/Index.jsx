import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { confirmAction } from '@/utils/swal';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useAuth } from '@/utils/authorization';
import { Plus, Trash2 } from 'lucide-react';

export default function Index({ roles, permissions }) {
    const { can } = useAuth();
    const [activeRole, setActiveRole] = useState(roles[0]?.name ?? null);
    const { data, setData, put, processing } = useForm({
        permissions: [],
    });

    const roleForm = useForm({
        name: '',
    });

    const permissionForm = useForm({
        name: '',
    });

    const selectedRole = roles.find((r) => r.name === activeRole);

    const togglePermission = (permission) => {
        const set = new Set(data.permissions);
        if (set.has(permission)) {
            set.delete(permission);
        } else {
            set.add(permission);
        }
        setData('permissions', Array.from(set));
    };

    const startEditing = (role) => {
        setActiveRole(role.name);
        setData('permissions', role.permissions.map((p) => p.name));
    };

    const submit = (event) => {
        event.preventDefault();
        put(route('roles.update', selectedRole.id));
    };

    const submitRole = (event) => {
        event.preventDefault();
        roleForm.post(route('roles.store'), {
            onSuccess: () => roleForm.reset(),
        });
    };

    const submitPermission = (event) => {
        event.preventDefault();
        permissionForm.post(route('permissions.store'), {
            onSuccess: () => permissionForm.reset(),
        });
    };

    const deleteRole = async (role) => {
        if (role.name === 'Super Admin') {
            return;
        }

        const confirmed = await confirmAction({
            title: 'Delete Role',
            text: `Are you sure you want to delete the "${role.name}" role?`,
            confirmButtonText: 'Yes, delete it',
        });

        if (confirmed) {
            router.delete(route('roles.destroy', role.id));
        }
    };

    return (
        <AuthenticatedLayout
            title="Roles & Permissions"
            breadcrumbs={[{ label: 'Roles & Permissions' }]}
        >
            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    {/* Roles list + create form */}
                    <div className="border-b border-gray-200 p-4 dark:border-gray-700 lg:border-b-0 lg:border-r">
                        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Roles
                        </h2>
                        <ul className="space-y-1">
                            {roles.map((role) => (
                                <li key={role.name} className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => startEditing(role)}
                                        className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                                            activeRole === role.name
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {role.name}
                                        <span className="ml-2 text-xs text-gray-400">
                                            ({role.permissions?.length ?? 0} permissions)
                                        </span>
                                    </button>
                                    {false && can('roles.update') && role.name !== 'Super Admin' && (
                                        <button
                                            type="button"
                                            onClick={() => deleteRole(role)}
                                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                            title="Delete role"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {can('roles.update') && (
                            <form onSubmit={submitRole} className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <InputLabel htmlFor="role_name" value="Add New Role" />
                                <div className="flex gap-2">
                                    <TextInput
                                        id="role_name"
                                        value={roleForm.data.name}
                                        onChange={(e) => roleForm.setData('name', e.target.value)}
                                        placeholder="e.g. Librarian"
                                        className="flex-1"
                                    />
                                    <PrimaryButton disabled={roleForm.processing}>
                                        <Plus className="h-4 w-4" />
                                    </PrimaryButton>
                                </div>
                                <InputError message={roleForm.errors.name} />
                            </form>
                        )}
                    </div>

                    {/* Permissions panel + create form */}
                    <div className="col-span-2 p-4">
                        {selectedRole && (
                            <form onSubmit={submit}>
                                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedRole.name}
                                </h2>
                                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                    Select the permissions to assign to this role.
                                </p>

                                <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                    {permissions.map((permission) => {
                                        const checked = data.permissions.includes(permission);
                                        return (
                                            <label
                                                key={permission}
                                                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                                                    checked
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                        : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => togglePermission(permission)}
                                                    disabled={!can('roles.update')}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                                {permission}
                                            </label>
                                        );
                                    })}
                                </div>

                                {can('roles.update') && (
                                    <div className="flex justify-end">
                                        <PrimaryButton disabled={processing}>Save Permissions</PrimaryButton>
                                    </div>
                                )}
                            </form>
                        )}

                        {false && can('roles.update') && (
                            <form onSubmit={submitPermission} className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <InputLabel htmlFor="permission_name" value="Add New Permission" />
                                <div className="flex gap-2">
                                    <TextInput
                                        id="permission_name"
                                        value={permissionForm.data.name}
                                        onChange={(e) => permissionForm.setData('name', e.target.value)}
                                        placeholder="e.g. library.manage"
                                        className="flex-1"
                                    />
                                    <PrimaryButton disabled={permissionForm.processing}>
                                        <Plus className="h-4 w-4" />
                                    </PrimaryButton>
                                </div>
                                <InputError message={permissionForm.errors.name} />
                                <p className="text-xs text-gray-400">
                                    Use a dot notation like <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">module.action</code> (e.g. <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">library.manage</code>).
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}
