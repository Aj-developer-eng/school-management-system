import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ setting, can_update }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        school_name: setting?.school_name ?? '',
        school_prefix: setting?.school_prefix ?? '',
        registration_number: setting?.registration_number ?? '',
        affiliation: setting?.affiliation ?? '',
        email: setting?.email ?? '',
        phone: setting?.phone ?? '',
        secondary_phone: setting?.secondary_phone ?? '',
        address: setting?.address ?? '',
        city: setting?.city ?? '',
        postal_code: setting?.postal_code ?? '',
        country: setting?.country ?? 'Pakistan',
        footer_text: setting?.footer_text ?? '',
        logo: null,
    });

    const [preview, setPreview] = useState(setting?.logo_url ?? null);

    const submit = (event) => {
        event.preventDefault();
        post(route('school-settings.update'));
    };

    const onLogoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setData('logo', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <AuthenticatedLayout
            title="School Settings"
            breadcrumbs={[{ label: 'School Settings' }]}
        >
            <Head title="School Settings" />

            <Card className="max-w-4xl">
                <form onSubmit={submit} className="space-y-6 p-6" encType="multipart/form-data">
                    <div>
                        <InputLabel htmlFor="school_name" value="School Name" />
                        <TextInput
                            id="school_name"
                            value={data.school_name}
                            onChange={(event) => setData('school_name', event.target.value)}
                            className="mt-1 block w-full"
                            isFocused
                            disabled={!can_update}
                        />
                        <InputError message={errors.school_name} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="school_prefix" value="School Prefix" />
                            <TextInput
                                id="school_prefix"
                                value={data.school_prefix}
                                onChange={(event) => setData('school_prefix', event.target.value.toUpperCase())}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Used in admission numbers ({data.school_prefix}-2025-0001)
                            </p>
                            <InputError message={errors.school_prefix} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="registration_number" value="Registration Number" />
                            <TextInput
                                id="registration_number"
                                value={data.registration_number}
                                onChange={(event) => setData('registration_number', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.registration_number} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="affiliation" value="Affiliation" />
                            <TextInput
                                id="affiliation"
                                value={data.affiliation}
                                onChange={(event) => setData('affiliation', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.affiliation} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
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
                                disabled={!can_update}
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="secondary_phone" value="Secondary Phone" />
                            <TextInput
                                id="secondary_phone"
                                value={data.secondary_phone}
                                onChange={(event) => setData('secondary_phone', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.secondary_phone} className="mt-2" />
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
                            disabled={!can_update}
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="city" value="City" />
                            <TextInput
                                id="city"
                                value={data.city}
                                onChange={(event) => setData('city', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.city} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="postal_code" value="Postal Code" />
                            <TextInput
                                id="postal_code"
                                value={data.postal_code}
                                onChange={(event) => setData('postal_code', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.postal_code} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="country" value="Country" />
                            <TextInput
                                id="country"
                                value={data.country}
                                onChange={(event) => setData('country', event.target.value)}
                                className="mt-1 block w-full"
                                disabled={!can_update}
                            />
                            <InputError message={errors.country} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="footer_text" value="Footer Text" />
                        <TextInput
                            id="footer_text"
                            value={data.footer_text}
                            onChange={(event) => setData('footer_text', event.target.value)}
                            className="mt-1 block w-full"
                            disabled={!can_update}
                        />
                        <InputError message={errors.footer_text} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="logo" value="School Logo" />
                        <input
                            id="logo"
                            type="file"
                            onChange={onLogoChange}
                            disabled={!can_update}
                            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                        />
                        <InputError message={errors.logo} className="mt-2" />
                        {preview && (
                            <img
                                src={preview}
                                alt="Logo preview"
                                className="mt-3 h-24 w-24 rounded-lg border border-gray-200 object-contain dark:border-gray-700"
                            />
                        )}
                    </div>

                    {can_update && (
                        <div className="flex items-center justify-end gap-4">
                            {recentlySuccessful && (
                                <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>
                            )}
                            <PrimaryButton disabled={processing}>Save Settings</PrimaryButton>
                        </div>
                    )}
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
