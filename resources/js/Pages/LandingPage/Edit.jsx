import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

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
    { value: 'Globe', label: 'Globe' },
    { value: 'LayoutDashboard', label: 'Dashboard' },
    { value: 'TrendingUp', label: 'Trending Up' },
    { value: 'CheckCircle2', label: 'Check Circle' },
    { value: 'MapPin', label: 'Map Pin' },
    { value: 'Calendar', label: 'Calendar' },
    { value: 'MessageCircle', label: 'Message Circle' },
    { value: 'Home', label: 'Home' },
    { value: 'PenTool', label: 'Pen Tool' },
    { value: 'Layers', label: 'Layers' },
    { value: 'Languages', label: 'Languages' },
    { value: 'Landmark', label: 'Landmark' },
    { value: 'BadgeCheck', label: 'Badge Check' },
    { value: 'Network', label: 'Network' },
    { value: 'Earth', label: 'Earth' },
];

export default function Edit({ settings }) {
    const [form, setForm] = useState({
        hero_badge_text: settings.hero_badge_text ?? '',
        hero_title: settings.hero_title ?? '',
        hero_title_highlight: settings.hero_title_highlight ?? '',
        hero_title_suffix: settings.hero_title_suffix ?? '',
        hero_subtitle: settings.hero_subtitle ?? '',
        hero_button_text: settings.hero_button_text ?? '',
        hero_button_link: settings.hero_button_link ?? '',
        hero_secondary_button_text: settings.hero_secondary_button_text ?? '',
        hero_secondary_button_link: settings.hero_secondary_button_link ?? '',
        hero_stats: settings.hero_stats ?? [],
        hero_float_label: settings.hero_float_label ?? '',
        hero_float_value: settings.hero_float_value ?? '',
        hero_float_sub: settings.hero_float_sub ?? '',
        banner_image_url: settings.banner_image_url ?? '',
        banner_image: null,
        programs_label: settings.programs_label ?? '',
        programs_title: settings.programs_title ?? '',
        programs_title_highlight: settings.programs_title_highlight ?? '',
        programs_link_text: settings.programs_link_text ?? '',
        programs: settings.programs ?? [],
        locations_label: settings.locations_label ?? '',
        locations_title: settings.locations_title ?? '',
        locations_title_highlight: settings.locations_title_highlight ?? '',
        locations_description: settings.locations_description ?? '',
        locations: settings.locations ?? [],
        dashboard_label: settings.dashboard_label ?? '',
        dashboard_title: settings.dashboard_title ?? '',
        dashboard_title_highlight: settings.dashboard_title_highlight ?? '',
        dashboard_description: settings.dashboard_description ?? '',
        dashboard_features: settings.dashboard_features ?? [],
        dashboard_button_text: settings.dashboard_button_text ?? '',
        dashboard_button_link: settings.dashboard_button_link ?? '',
        dashboard_preview: settings.dashboard_preview ?? {},
        dashboard_preview_label: settings.dashboard_preview_label ?? '',
        dashboard_preview_status: settings.dashboard_preview_status ?? '',
        dashboard_preview_units_label: settings.dashboard_preview_units_label ?? '',
        dashboard_preview_attendance_label: settings.dashboard_preview_attendance_label ?? '',
        dashboard_preview_ielts_label: settings.dashboard_preview_ielts_label ?? '',
        dashboard_preview_mentor_label: settings.dashboard_preview_mentor_label ?? '',
        why_us_label: settings.why_us_label ?? '',
        why_us_title: settings.why_us_title ?? '',
        why_us_title_highlight: settings.why_us_title_highlight ?? '',
        why_us: settings.why_us ?? [],
        testimonials_label: settings.testimonials_label ?? '',
        testimonials_title: settings.testimonials_title ?? '',
        testimonials_title_highlight: settings.testimonials_title_highlight ?? '',
        testimonials: settings.testimonials ?? [],
        cta_badge_text: settings.cta_badge_text ?? '',
        cta_title: settings.cta_title ?? '',
        cta_title_highlight: settings.cta_title_highlight ?? '',
        cta_description: settings.cta_description ?? '',
        cta_button_text: settings.cta_button_text ?? '',
        cta_button_link: settings.cta_button_link ?? '',
        cta_secondary_button_text: settings.cta_secondary_button_text ?? '',
        cta_secondary_button_link: settings.cta_secondary_button_link ?? '',
        footer_description: settings.footer_description ?? '',
        footer_programs_label: settings.footer_programs_label ?? '',
        footer_institute_label: settings.footer_institute_label ?? '',
        footer_institute_links: settings.footer_institute_links ?? [],
        footer_reach_label: settings.footer_reach_label ?? '',
        footer_mode_text: settings.footer_mode_text ?? '',
        footer_tagline: settings.footer_tagline ?? '',
    });

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const updateArrayItem = (arrayField, index, field, value) => {
        setForm((prev) => ({
            ...prev,
            [arrayField]: prev[arrayField].map((item, i) => i === index ? { ...item, [field]: value } : item),
        }));
    };

    const addArrayItem = (arrayField, template) => {
        setForm((prev) => ({ ...prev, [arrayField]: [...prev[arrayField], template] }));
    };

    const removeArrayItem = (arrayField, index) => {
        setForm((prev) => ({ ...prev, [arrayField]: prev[arrayField].filter((_, i) => i !== index) }));
    };

    // Image handlers
    const bannerInputRef = useRef(null);
    const [bannerPreview, setBannerPreview] = useState(settings.banner_image_url ?? null);
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) { setForm((p) => ({ ...p, banner_image: file })); setBannerPreview(URL.createObjectURL(file)); }
    };
    const handleBannerRemove = () => {
        setForm((p) => ({ ...p, banner_image: null })); setBannerPreview(null);
        if (bannerInputRef.current) bannerInputRef.current.value = '';
    };

    const submit = (e) => {
        e.preventDefault();
        router.post(route('landing-page.update'), form, { preserveScroll: true, forceFormData: true });
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
                        <h3 className="text-base font-semibold text-gray-900">Hero Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Badge Text" value={form.hero_badge_text} onChange={(v) => update('hero_badge_text', v)} placeholder="Online & on-site · Pakistan · Dubai · UK" />
                        <div />
                        <Field label="Hero Title" value={form.hero_title} onChange={(v) => update('hero_title', v)} placeholder="Global pathways to" full />
                        <Field label="Hero Title Highlight" value={form.hero_title_highlight} onChange={(v) => update('hero_title_highlight', v)} placeholder="world-class" />
                        <Field label="Hero Title Suffix" value={form.hero_title_suffix} onChange={(v) => update('hero_title_suffix', v)} placeholder="degrees." />
                        <TextArea label="Hero Subtitle" value={form.hero_subtitle} onChange={(v) => update('hero_subtitle', v)} placeholder="Description text..." full />
                        <Field label="Primary Button Text" value={form.hero_button_text} onChange={(v) => update('hero_button_text', v)} placeholder="Open my dashboard" />
                        <Field label="Primary Button Link" value={form.hero_button_link} onChange={(v) => update('hero_button_link', v)} placeholder="/dashboard" />
                        <Field label="Secondary Button Text" value={form.hero_secondary_button_text} onChange={(v) => update('hero_secondary_button_text', v)} placeholder="Explore programs" />
                        <Field label="Secondary Button Link" value={form.hero_secondary_button_link} onChange={(v) => update('hero_secondary_button_link', v)} placeholder="#programs" />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Hero Stats Cards</label>
                            <button type="button" onClick={() => addArrayItem('hero_stats', { label: '', value: '' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Stat
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.hero_stats.map((stat, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                    <div className="grid flex-1 grid-cols-2 gap-3">
                                        <Field label="Label" value={stat.label} onChange={(v) => updateArrayItem('hero_stats', i, 'label', v)} placeholder="Programs" noLabel />
                                        <Field label="Value" value={stat.value} onChange={(v) => updateArrayItem('hero_stats', i, 'value', v)} placeholder="7+" noLabel />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('hero_stats', i)} className="mt-1 text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <label className="mb-3 block text-sm font-medium text-gray-700">Floating Progress Card</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field label="Label" value={form.hero_float_label} onChange={(v) => update('hero_float_label', v)} placeholder="Live progress" />
                            <Field label="Value" value={form.hero_float_value} onChange={(v) => update('hero_float_value', v)} placeholder="IELTS 7.5" />
                            <Field label="Sub-text" value={form.hero_float_sub} onChange={(v) => update('hero_float_sub', v)} placeholder="Mock band · on target" />
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                        <div className="mt-2 flex items-start gap-5">
                            <div className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
                                {bannerPreview ? (
                                    <img src={bannerPreview} alt="Banner preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} className="hidden" />
                                <button type="button" onClick={() => bannerInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                                    <Upload className="h-4 w-4" /> Upload Image
                                </button>
                                {bannerPreview && (
                                    <button type="button" onClick={handleBannerRemove} className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                                        <X className="h-4 w-4" /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Programs Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Programs Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Section Label" value={form.programs_label} onChange={(v) => update('programs_label', v)} placeholder="Programs" />
                        <Field label="Link Text" value={form.programs_link_text} onChange={(v) => update('programs_link_text', v)} placeholder="See how we measure progress" />
                        <Field label="Section Title" value={form.programs_title} onChange={(v) => update('programs_title', v)} placeholder="Every pathway, from school entrance to" full />
                        <Field label="Title Highlight" value={form.programs_title_highlight} onChange={(v) => update('programs_title_highlight', v)} placeholder="UK graduation" full />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Program Cards</label>
                            <button type="button" onClick={() => addArrayItem('programs', { icon: 'BookOpen', title: '', description: '', badge: '' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Program
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.programs.map((prog, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                        <SelectField label="Icon" value={prog.icon} onChange={(v) => updateArrayItem('programs', i, 'icon', v)} options={iconOptions} />
                                        <Field label="Title" value={prog.title} onChange={(v) => updateArrayItem('programs', i, 'title', v)} placeholder="O/A Level Coaching" />
                                        <Field label="Badge" value={prog.badge ?? ''} onChange={(v) => updateArrayItem('programs', i, 'badge', v)} placeholder="Cambridge · Pearson" />
                                        <Field label="Description" value={prog.description} onChange={(v) => updateArrayItem('programs', i, 'description', v)} placeholder="Structured preparation..." />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('programs', i)} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Locations Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Locations Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Section Label" value={form.locations_label} onChange={(v) => update('locations_label', v)} placeholder="Where we are" />
                        <Field label="Title Highlight" value={form.locations_title_highlight} onChange={(v) => update('locations_title_highlight', v)} placeholder="across borders" />
                        <Field label="Section Title" value={form.locations_title} onChange={(v) => update('locations_title', v)} placeholder="Study online, on-site or" full />
                        <TextArea label="Description" value={form.locations_description} onChange={(v) => update('locations_description', v)} placeholder="All programs are delivered..." full />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Location Cards</label>
                            <button type="button" onClick={() => addArrayItem('locations', { title: '', description: '', icon: 'MapPin' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Location
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.locations.map((loc, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <SelectField label="Icon" value={loc.icon ?? 'MapPin'} onChange={(v) => updateArrayItem('locations', i, 'icon', v)} options={iconOptions} />
                                        <Field label="Title" value={loc.title} onChange={(v) => updateArrayItem('locations', i, 'title', v)} placeholder="Pakistan" />
                                        <Field label="Description" value={loc.description} onChange={(v) => updateArrayItem('locations', i, 'description', v)} placeholder="On-site campuses..." />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('locations', i)} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Dashboard Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Dashboard Preview Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Section Label" value={form.dashboard_label} onChange={(v) => update('dashboard_label', v)} placeholder="Student Dashboard" />
                        <Field label="Title Highlight" value={form.dashboard_title_highlight} onChange={(v) => update('dashboard_title_highlight', v)} placeholder="one view" />
                        <Field label="Section Title" value={form.dashboard_title} onChange={(v) => update('dashboard_title', v)} placeholder="Your academic journey, in" full />
                        <TextArea label="Description" value={form.dashboard_description} onChange={(v) => update('dashboard_description', v)} placeholder="Track assessment scores..." full />
                        <Field label="Button Text" value={form.dashboard_button_text} onChange={(v) => update('dashboard_button_text', v)} placeholder="Open my dashboard" />
                        <Field label="Button Link" value={form.dashboard_button_link} onChange={(v) => update('dashboard_button_link', v)} placeholder="/dashboard" />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Dashboard Features (checklist)</label>
                            <button type="button" onClick={() => addArrayItem('dashboard_features', '')} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Feature
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.dashboard_features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={feat}
                                        onChange={(e) => updateArrayItem('dashboard_features', i, '', e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                        placeholder="Course-by-course progress..."
                                    />
                                    <button type="button" onClick={() => removeArrayItem('dashboard_features', i)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <label className="mb-3 block text-sm font-medium text-gray-700">Dashboard Preview Card</label>
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Preview Label" value={form.dashboard_preview_label} onChange={(v) => update('dashboard_preview_label', v)} placeholder="Pathway Snapshot" />
                            <Field label="Status Badge" value={form.dashboard_preview_status} onChange={(v) => update('dashboard_preview_status', v)} placeholder="On track" />
                            <Field label="Units Label" value={form.dashboard_preview_units_label} onChange={(v) => update('dashboard_preview_units_label', v)} placeholder="Units" />
                            <Field label="Attendance Label" value={form.dashboard_preview_attendance_label} onChange={(v) => update('dashboard_preview_attendance_label', v)} placeholder="Attendance" />
                            <Field label="IELTS Label" value={form.dashboard_preview_ielts_label} onChange={(v) => update('dashboard_preview_ielts_label', v)} placeholder="IELTS Mock" />
                            <Field label="Mentor Note Label" value={form.dashboard_preview_mentor_label} onChange={(v) => update('dashboard_preview_mentor_label', v)} placeholder="Mentor note" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Course" value={form.dashboard_preview.course ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, course: v })} placeholder="BTEC Level 3 · 2026" />
                            <Field label="Units (label)" value={form.dashboard_preview.units ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, units: v })} placeholder="12/18" />
                            <Field label="Units (% bar)" value={form.dashboard_preview.units_pct ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, units_pct: v })} placeholder="67" />
                            <Field label="Attendance (label)" value={form.dashboard_preview.attendance ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, attendance: v })} placeholder="94%" />
                            <Field label="Attendance (% bar)" value={form.dashboard_preview.attendance_pct ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, attendance_pct: v })} placeholder="94" />
                            <Field label="IELTS Mock (label)" value={form.dashboard_preview.ielts ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, ielts: v })} placeholder="7.5" />
                            <Field label="IELTS Mock (% bar)" value={form.dashboard_preview.ielts_pct ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, ielts_pct: v })} placeholder="83" />
                            <TextArea label="Mentor Note" value={form.dashboard_preview.mentor_note ?? ''} onChange={(v) => update('dashboard_preview', { ...form.dashboard_preview, mentor_note: v })} placeholder="Consistent unit submissions..." full />
                        </div>
                    </div>
                </Card>

                {/* Why Us Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Why Us Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Section Label" value={form.why_us_label} onChange={(v) => update('why_us_label', v)} placeholder="Why EdSkills Global" />
                        <Field label="Title Highlight" value={form.why_us_title_highlight} onChange={(v) => update('why_us_title_highlight', v)} placeholder="education partner" />
                        <Field label="Section Title" value={form.why_us_title} onChange={(v) => update('why_us_title', v)} placeholder="A different kind of" full />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Why Us Cards</label>
                            <button type="button" onClick={() => addArrayItem('why_us', { title: '', description: '', icon: 'Sparkles' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Card
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.why_us.map((item, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <SelectField label="Icon" value={item.icon ?? 'Sparkles'} onChange={(v) => updateArrayItem('why_us', i, 'icon', v)} options={iconOptions} />
                                        <Field label="Title" value={item.title} onChange={(v) => updateArrayItem('why_us', i, 'title', v)} placeholder="Pearson-aligned delivery" />
                                        <Field label="Description" value={item.description} onChange={(v) => updateArrayItem('why_us', i, 'description', v)} placeholder="BTEC and Pearson diploma content..." />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('why_us', i)} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Testimonials Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Testimonials Section</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        <Field label="Section Label" value={form.testimonials_label} onChange={(v) => update('testimonials_label', v)} placeholder="Student voices" />
                        <Field label="Title Highlight" value={form.testimonials_title_highlight} onChange={(v) => update('testimonials_title_highlight', v)} placeholder="own words" />
                        <Field label="Section Title" value={form.testimonials_title} onChange={(v) => update('testimonials_title', v)} placeholder="Results, in their" full />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Testimonial Cards</label>
                            <button type="button" onClick={() => addArrayItem('testimonials', { name: '', program: '', location: '', quote: '' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Testimonial
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.testimonials.map((t, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <Field label="Name" value={t.name} onChange={(v) => updateArrayItem('testimonials', i, 'name', v)} placeholder="Ayesha R." />
                                        <Field label="Program" value={t.program} onChange={(v) => updateArrayItem('testimonials', i, 'program', v)} placeholder="SAT Coaching" />
                                        <Field label="Location" value={t.location} onChange={(v) => updateArrayItem('testimonials', i, 'location', v)} placeholder="Lahore" />
                                    </div>
                                    <div className="mt-3">
                                        <TextArea label="Quote" value={t.quote} onChange={(v) => updateArrayItem('testimonials', i, 'quote', v)} placeholder="The structured practice..." full />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('testimonials', i)} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* CTA Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">CTA Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Badge Text" value={form.cta_badge_text} onChange={(v) => update('cta_badge_text', v)} placeholder="Begin your journey" />
                            <Field label="Title Highlight" value={form.cta_title_highlight} onChange={(v) => update('cta_title_highlight', v)} placeholder="seriously" />
                        </div>
                        <Field label="CTA Title" value={form.cta_title} onChange={(v) => update('cta_title', v)} placeholder="Your future deserves a partner that takes it" full />
                        <TextArea label="CTA Description" value={form.cta_description} onChange={(v) => update('cta_description', v)} placeholder="Create your student account..." full />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Primary Button Text" value={form.cta_button_text} onChange={(v) => update('cta_button_text', v)} placeholder="Create student account" />
                            <Field label="Primary Button Link" value={form.cta_button_link} onChange={(v) => update('cta_button_link', v)} placeholder="/login" />
                            <Field label="Secondary Button Text" value={form.cta_secondary_button_text} onChange={(v) => update('cta_secondary_button_text', v)} placeholder="I already have an account" />
                            <Field label="Secondary Button Link" value={form.cta_secondary_button_link} onChange={(v) => update('cta_secondary_button_link', v)} placeholder="/login" />
                        </div>
                    </div>
                </Card>

                {/* Footer Section */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Footer Section</h3>
                    </div>
                    <div className="space-y-5 p-6">
                        <TextArea label="Footer Description" value={form.footer_description} onChange={(v) => update('footer_description', v)} placeholder="Global pathways from..." full />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field label="Programs Label" value={form.footer_programs_label} onChange={(v) => update('footer_programs_label', v)} placeholder="Programs" />
                            <Field label="Institute Label" value={form.footer_institute_label} onChange={(v) => update('footer_institute_label', v)} placeholder="Institute" />
                            <Field label="Reach Us Label" value={form.footer_reach_label} onChange={(v) => update('footer_reach_label', v)} placeholder="Reach us" />
                            <Field label="Mode Text" value={form.footer_mode_text} onChange={(v) => update('footer_mode_text', v)} placeholder="Online & On-site" />
                        </div>
                        <Field label="Footer Tagline" value={form.footer_tagline} onChange={(v) => update('footer_tagline', v)} placeholder="Crafted for tomorrow's leaders." full />
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Institute Links</label>
                            <button type="button" onClick={() => addArrayItem('footer_institute_links', { label: '', link: '#' })} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-4 w-4" /> Add Link
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.footer_institute_links.map((link, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                    <div className="grid flex-1 grid-cols-2 gap-3">
                                        <Field label="Label" value={link.label ?? ''} onChange={(v) => updateArrayItem('footer_institute_links', i, 'label', v)} placeholder="About" noLabel />
                                        <Field label="Link" value={link.link ?? ''} onChange={(v) => updateArrayItem('footer_institute_links', i, 'link', v)} placeholder="#" noLabel />
                                    </div>
                                    <button type="button" onClick={() => removeArrayItem('footer_institute_links', i)} className="mt-1 text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-gray-100 px-6 py-4">
                        <p className="text-sm text-gray-500">Note: Contact info (address, phone, email) and copyright text are managed in School Settings.</p>
                    </div>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4">
                    <a href={route('landing')} target="_blank" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Preview Landing Page
                    </a>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                        Save Changes
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Field({ label, value, onChange, placeholder, full, noLabel }) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            {!noLabel && <label className="block text-sm font-medium text-gray-700">{label}</label>}
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
