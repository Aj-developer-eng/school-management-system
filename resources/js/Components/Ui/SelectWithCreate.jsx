import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useAuth } from '@/utils/authorization';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SelectWithCreate({
    id,
    label,
    value,
    onChange,
    options = {},
    placeholder = 'Select',
    emptyMessage = 'No options available',
    createRoute,
    createPermission,
    errors,
    className = '',
}) {
    const { can } = useAuth();
    const canCreate = Boolean(createPermission) && can(createPermission);

    const [entries, setEntries] = useState(() => Object.entries(options ?? {}));
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState(null);

    // Keep in step with props when the parent reloads the option list.
    useEffect(() => {
        setEntries(Object.entries(options ?? {}));
    }, [options]);

    const create = async () => {
        const name = newName.trim();

        if (!name) {
            return;
        }

        setSaving(true);
        setCreateError(null);

        try {
            // axios (not fetch) so the XSRF-TOKEN cookie is echoed back in the
            // X-XSRF-TOKEN header and Laravel's CSRF check passes.
            const { data: created } = await axios.post(route(createRoute), { name });

            setEntries((current) =>
                [...current, [String(created.id), created.name]].sort((a, b) =>
                    a[1].localeCompare(b[1]),
                ),
            );
            onChange(String(created.id));
            setNewName('');
            setAdding(false);
        } catch (exception) {
            const payload = exception?.response?.data;

            setCreateError(
                payload?.errors?.name?.[0] ??
                    payload?.message ??
                    (exception?.response?.status === 419
                        ? 'Your session expired. Please refresh the page and try again.'
                        : 'Unable to create the option.'),
            );
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setAdding(false);
        setNewName('');
        setCreateError(null);
    };

    return (
        <div className={className}>
            <InputLabel htmlFor={id} value={label} />

            {adding ? (
                <div className="mt-1 flex items-start gap-2">
                    <TextInput
                        id={id}
                        value={newName}
                        onChange={(event) => {
                            setNewName(event.target.value);
                            setCreateError(null);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                create();
                            } else if (event.key === 'Escape') {
                                cancel();
                            }
                        }}
                        className="block flex-1"
                        placeholder="New name"
                        autoFocus
                    />
                    <PrimaryButton
                        type="button"
                        onClick={create}
                        disabled={saving || !newName.trim()}
                        className="h-[42px] px-4"
                    >
                        {saving ? 'Adding…' : 'Add'}
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={cancel}
                        className="h-[42px] rounded-md px-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="mt-1 flex items-center gap-2">
                    <select
                        id={id}
                        value={value ?? ''}
                        onChange={(event) => onChange(event.target.value)}
                        className="block flex-1 rounded-md border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                        <option value="">{placeholder}</option>
                        {entries.map(([optionId, optionName]) => (
                            <option key={optionId} value={optionId}>
                                {optionName}
                            </option>
                        ))}
                    </select>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            title={`Add new ${label?.toLowerCase() ?? 'option'}`}
                            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-indigo-300"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            )}

            {createError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createError}</p>
            )}
            {entries.length === 0 && !adding && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            )}

            <InputError message={errors} className="mt-2" />
        </div>
    );
}