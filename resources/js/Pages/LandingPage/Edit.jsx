import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const iconOptions = [
    { value: 'BookOpen', label: 'Book Open' },
    { value: 'Award', label: 'Award' },
    { value: 'Users', label: 'Users' },
    { value: 'Target', label: 'Target' },
    { value: 'Lightbulb', label: 'Lightbulb' },
    { value: 'HandHeart', label: 'Hand Heart' },
    { value: 'GraduationCap', label: 'Graduation Cap' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Building2', label: 'Building' },
    { value: 'Sparkles', label: 'Sparkles' },
];

export default function Edit({ settings, teachers }) {
    const [form, setForm] = useState({
        hero_badge_text: settings.hero_badge_text ?? '',
        hero_title: settings.hero_title ?? '',
        hero_title_highlight: settings.hero_title_highlight ?? '',
        hero_subtitle: settings.hero_subtitle ?? '',
        hero_button_text: settings.hero_button_text ?? '',
        hero_button_link: settings.hero_button_link ?? '',
        hero_secondary_button_text: settings.hero_secondary_button_text ?? '',
        hero_secondary_button_link: settings.hero_secondary_button_link ?? '',
        banner_image_url: settings.banner_image_url ?? '',
        about_label: settings.about_label ?? '',
        about_title: settings.about_title ?? '',
        about_description: settings.about_description ?? '',
        about_features: settings.about_features ?? [
            { icon: 'BookOpen', title: '', description: '' },
            { icon: 'Award', title: '', description: '' },
            { icon: 'Users', title: '', description: '' },
        ],
        values: settings.values ?? [
            { icon: 'Target', title: '', description: '' },
            { icon: 'Lightbulb', title: '', description: '' },
            { icon: 'HandHeart', title: '', description: '' },
        ],
        teachers_label: settings.teachers_label ?? '',
        teachers_title: settings.teachers_title ?? '',
        teachers_subtitle: settings.teachers_subtitle ?? '',
        founder_name: settings.founder_name ?? '',
        founder_qualification: settings.founder_qualification ?? '',
        founder_bio: settings.founder_bio ?? '',
        admissions_title: settings.admissions_title ?? '',
        admissions_description: settings.admissions_description ?? '',
        admissions_button_text: settings.admissions_button_text ?? '',
        admissions_button_link: settings.admissions_button_link ?? '',
        admissions_secondary_button_text: settings.admissions_secondary_button_text ?? '',
        admissions_secondary_button_link: settings.admissions_secondary_button_link ?? '',
        footer_description: settings.footer_description ?? '',
    });

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const updateFeature = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            about_features: prev.about_features.map((f, i) => i === index ? { ...f, [field]: value } : f),
        }));
    };

    const updateValue = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            values: prev.values.map((v, i) => i === index ? { ...v, [field]: value } : v),
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        router.post(route('landing-page.update'), form, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            title="Landing Page Content"
            breadcrumbs={[{ label: 'Administration' }, { label: 'Landing Page' }]}
        >
            <form onSubmit={submit} className="space-y-6">
                {/* Hero Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Hero / Banner Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Badge Text" value={form.hero_badge_text} onChange={(v) => update('hero_badge_text', v)} placeholder="Admissions Open for 2026-2027" />
                        <Field label="Banner Image URL" value={form.banner_image_url} onChange={(v) => update('banner_image_url', v)} placeholder="https://images.unsplash.com/..." />
                        <Field label="Hero Title" value={form.hero_title} onChange={(v) => update('hero_title', v)} placeholder="Nurturing Tomorrow's" full />
                        <Field label="Hero Title Highlight (second line)" value={form.hero_title_highlight} onChange={(v) => update('hero_title_highlight', v)} placeholder="Leaders Today" full />
                        <TextArea label="Hero Subtitle" value={form.hero_subtitle} onChange={(v) => update('hero_subtitle', v)} placeholder="Welcome to our school..." full />
                        <Field label="Primary Button Text" value={form.hero_button_text} onChange={(v) => update('hero_button_text', v)} placeholder="Apply for Admission" />
                        <Field label="Primary Button Link" value={form.hero_button_link} onChange={(v) => update('hero_button_link', v)} placeholder="#admissions" />
                        <Field label="Secondary Button Text" value={form.hero_secondary_button_text} onChange={(v) => update('hero_secondary_button_text', v)} placeholder="Learn More" />
                        <Field label="Secondary Button Link" value={form.hero_secondary_button_link} onChange={(v) => update('hero_secondary_button_link', v)} placeholder="#about" />
                    </div>
                </Card>

                {/* About Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">About Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Section Label" value={form.about_label} onChange={(v) => update('about_label', v)} placeholder="About Our School" />
                            <div />
                            <Field label="About Title" value={form.about_title} onChange={(v) => update('about_title', v)} placeholder="A Legacy of Excellence in Education" full />
                        </div>
                        <TextArea label="About Description" value={form.about_description} onChange={(v) => update('about_description', v)} placeholder="At our school, we believe..." full />

                        <div>
                            <label className="block text-sm font-medium text-gray-700">About Features</label>
                            <div className="mt-3 space-y-4">
                                {form.about_features.map((feature, i) => (
                                    <div key={i} className="rounded-lg border border-gray-200 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <SelectField
                                                label="Icon"
                                                value={feature.icon}
                                                onChange={(v) => updateFeature(i, 'icon', v)}
                                                options={iconOptions}
                                            />
                                            <Field label="Title" value={feature.title} onChange={(v) => updateFeature(i, 'title', v)} placeholder="Comprehensive Curriculum" />
                                            <Field label="Description" value={feature.description} onChange={(v) => updateFeature(i, 'description', v)} placeholder="Modern education..." />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Values Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Values Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Value Cards</label>
                            <div className="mt-3 space-y-4">
                                {form.values.map((val, i) => (
                                    <div key={i} className="rounded-lg border border-gray-200 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <SelectField
                                                label="Icon"
                                                value={val.icon}
                                                onChange={(v) => updateValue(i, 'icon', v)}
                                                options={iconOptions}
                                            />
                                            <Field label="Title" value={val.title} onChange={(v) => updateValue(i, 'title', v)} placeholder="Our Mission" />
                                            <Field label="Description" value={val.description} onChange={(v) => updateValue(i, 'description', v)} placeholder="To provide..." />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Teachers / Founder Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Teachers & Founder Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Section Label" value={form.teachers_label} onChange={(v) => update('teachers_label', v)} placeholder="Our Team" />
                            <Field label="Section Title" value={form.teachers_title} onChange={(v) => update('teachers_title', v)} placeholder="Founder & Featured Teachers" />
                        </div>
                        <Field label="Section Subtitle" value={form.teachers_subtitle} onChange={(v) => update('teachers_subtitle', v)} placeholder="Meet the passionate educators..." full />

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <h4 className="mb-3 text-sm font-semibold text-amber-800">Founder Details</h4>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Founder Name" value={form.founder_name} onChange={(v) => update('founder_name', v)} placeholder="Dr. Muhammad Abdullah" />
                                <Field label="Founder Qualification" value={form.founder_qualification} onChange={(v) => update('founder_qualification', v)} placeholder="PhD in Education, Founder & Principal" />
                            </div>
                            <div className="mt-4">
                                <TextArea label="Founder Bio" value={form.founder_bio} onChange={(v) => update('founder_bio', v)} placeholder="With over 25 years of experience..." full />
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm text-gray-600">
                                Featured teachers are automatically pulled from active teachers in the system (up to 4).
                                Manage teacher profiles and their bio/qualification from the Teachers section.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Admissions CTA Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Admissions CTA Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <Field label="Admissions Title" value={form.admissions_title} onChange={(v) => update('admissions_title', v)} placeholder="Admissions Are Now Open" full />
                        <TextArea label="Admissions Description" value={form.admissions_description} onChange={(v) => update('admissions_description', v)} placeholder="Secure your child's future..." full />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Primary Button Text" value={form.admissions_button_text} onChange={(v) => update('admissions_button_text', v)} placeholder="Contact Us" />
                            <Field label="Primary Button Link" value={form.admissions_button_link} onChange={(v) => update('admissions_button_link', v)} placeholder="tel:+1234567890" />
                            <Field label="Secondary Button Text" value={form.admissions_secondary_button_text} onChange={(v) => update('admissions_secondary_button_text', v)} placeholder="Email Us" />
                            <Field label="Secondary Button Link" value={form.admissions_secondary_button_link} onChange={(v) => update('admissions_secondary_button_link', v)} placeholder="mailto:info@school.com" />
                        </div>
                    </div>
                </Card>

                {/* Footer Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Footer Section</h3>
                    </div>
                    <div className="p-6">
                        <TextArea label="Footer Description" value={form.footer_description} onChange={(v) => update('footer_description', v)} placeholder="Providing quality education and building character..." full />
                        <p className="mt-3 text-sm text-gray-500">
                            Note: Contact info (address, phone, email) and footer copyright text are managed in School Settings.
                        </p>
                    </div>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4">
                    <a
                        href={route('landing')}
                        target="_blank"
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Preview Landing Page
                    </a>
                    <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, value, onChange, placeholder, full }) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
        </div>
    );
}

function TextArea({ label, value, onChange, placeholder, full }) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
