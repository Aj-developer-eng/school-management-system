import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    ArrowRight,
    Award,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Heart,
    MapPin,
    Mail,
    Phone,
    MessageCircle,
    Users,
    Building2,
    Calendar,
    Sparkles,
    Target,
    Lightbulb,
    HandHeart,
} from 'lucide-react';

const iconMap = {
    BookOpen, Award, Users, Target, Lightbulb, HandHeart, GraduationCap, Heart, Building2, Sparkles,
};

export default function Landing({ school, cms, activeSession, stats, featuredTeachers }) {
    const schoolName = school?.school_name ?? 'School Management System';
    const address = school ? `${school.address ?? ''}, ${school.city ?? ''}`.trim().replace(/,$/, '') : '';
    const phone = school?.phone ?? '';
    const email = school?.email ?? '';
    const footerText = school?.footer_text ?? schoolName;

    const c = cms ?? {};
    const heroBadge = c.hero_badge_text || (activeSession ? `Admissions Open for ${activeSession.name}` : '');
    const heroTitle = c.hero_title || "Nurturing Tomorrow's";
    const heroHighlight = c.hero_title_highlight || 'Leaders Today';
    const heroSubtitle = c.hero_subtitle || `Welcome to ${schoolName}, where excellence meets opportunity. We provide quality education with a focus on character building, critical thinking, and holistic development.`;
    const bannerImage = c.banner_image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80';

    const aboutLabel = c.about_label || 'About Our School';
    const aboutTitle = c.about_title || 'A Legacy of Excellence in Education';
    const aboutDesc = c.about_description || `At ${schoolName}, we believe every child has unique potential. Our dedicated faculty, modern facilities, and comprehensive curriculum ensure that each student receives the guidance and resources they need to excel academically and personally.`;
    const aboutImage = c.about_image_url || 'https://img.magnific.com/free-photo/closeup-shot-beautiful-butterfly-with-interesting-textures-orange-petaled-flower_181624-7640.jpg?semt=ais_test_b&w=740&q=80';
    const values = c.values?.length ? c.values : [
        { icon: 'Target', title: 'Our Mission', description: 'To provide a nurturing environment where students discover their passions and develop the skills needed for a rapidly changing world.' },
        { icon: 'Lightbulb', title: 'Our Vision', description: 'To be a center of educational excellence, empowering students to become confident, compassionate, and responsible global citizens.' },
        { icon: 'HandHeart', title: 'Our Promise', description: 'Every student receives personalized attention, quality teaching, and the support they need to reach their full potential.' },
    ];

    const teachersLabel = c.teachers_label || 'Our Team';
    const teachersTitle = c.teachers_title || 'Founder & Featured Teachers';
    const teachersSubtitle = c.teachers_subtitle || "Meet the passionate educators who shape our students' future.";
    const founderName = c.founder_name || 'Dr. Muhammad Abdullah';
    const founderQualification = c.founder_qualification || 'PhD in Education, Founder & Principal';
    const founderBio = c.founder_bio || 'With over 25 years of experience in education, Dr. Abdullah founded this institution with a vision to provide accessible, high-quality education to all.';
    const founderImage = c.founder_image_url;

    const admissionsTitle = c.admissions_title || 'Admissions Are Now Open';
    const admissionsDesc = c.admissions_description || "Secure your child's future with quality education. Limited seats available for the upcoming academic session. Apply early to avoid disappointment.";
    const admissionsBtnText = c.admissions_button_text || 'Chat on WhatsApp';
    const rawAdmissionsBtnLink = c.admissions_button_link || `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
    const admissionsBtnLink = rawAdmissionsBtnLink.startsWith('http') || rawAdmissionsBtnLink.startsWith('mailto')
        ? rawAdmissionsBtnLink
        : `https://wa.me/${rawAdmissionsBtnLink.replace(/[^0-9]/g, '')}`;

    const footerDesc = c.footer_description || 'Providing quality education and building character since our founding. We are committed to nurturing the leaders of tomorrow.';

    return (
        <>
            <Head title={schoolName} />
            <div className="min-h-screen bg-white">
                {/* Navbar */}
                <nav className="absolute inset-x-0 top-0 z-50 transition-all duration-300">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 hover:scale-110">
                                {school?.logo_url ? (
                                    <img src={school.logo_url} alt={schoolName} className="h-full w-full rounded-xl object-contain" />
                                ) : (
                                    <GraduationCap className="h-6 w-6 text-white" />
                                )}
                            </div>
                            <span className="text-lg font-bold text-white">{schoolName}</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <a href="#about" className="hidden text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white sm:block">About</a>
                            <a href="#stats" className="hidden text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white sm:block">Stats</a>
                            <a href="#teachers" className="hidden text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white sm:block">Teachers</a>
                            <a href="#admissions" className="hidden text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white sm:block">Admissions</a>
                            <Link
                                href={route('login')}
                                className="rounded-lg bg-white/95 px-5 py-2 text-sm font-semibold text-indigo-700 shadow-lg transition-all duration-300 hover:bg-white hover:shadow-xl"
                            >
                                Portal Login
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Banner */}
                <section className="relative min-h-[680px] overflow-hidden bg-gray-950">
                    <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
                    <div className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="relative z-10 mx-auto flex max-w-7xl items-center gap-12 px-6 py-32">
                        <div className="flex-1 max-w-3xl">
                            {heroBadge && (
                                <div
                                    className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-500 hover:bg-white/15"
                                    style={{ animation: 'fadeInDown 0.8s ease-out' }}
                                >
                                    <Calendar className="h-4 w-4" />
                                    {heroBadge}
                                </div>
                            )}
                            <h1
                                className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
                                style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
                            >
                                {heroTitle}
                                <span className="block bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                                    {heroHighlight}
                                </span>
                            </h1>
                            <p
                                className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl"
                                style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}
                            >
                                {heroSubtitle}
                            </p>
                            <div
                                className="mt-10 flex flex-wrap gap-4"
                                style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}
                            >
                              
                            </div>
                        </div>
                        <div className="hidden flex-1 lg:block" style={{ animation: 'fadeInRight 1s ease-out 0.3s both, float 6s ease-in-out infinite 1.3s' }}>
                            <div className="overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                                <img src={bannerImage} alt="School campus" className="h-[480px] w-full object-cover" style={{ animation: 'slowZoom 20s ease-in-out infinite alternate' }} />
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 100" className="w-full" preserveAspectRatio="none">
                            <path d="M0,50 C360,100 720,0 1440,50 L1440,100 L0,100 Z" fill="white" />
                        </svg>
                    </div>
                </section>

                {/* Stats Section */}
                <section id="stats" className="-mt-2 py-20">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-12 text-center">
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Our Impact</span>
                            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
                                Trusted by the Community
                            </h2>
                            <p className="mt-4 text-gray-500">Numbers that reflect our commitment to excellence.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                            <StatCard icon={<Users className="h-7 w-7" />} value={stats.students} label="Active Students" color="indigo" delay={0} />
                            <StatCard icon={<GraduationCap className="h-7 w-7" />} value={stats.teachers} label="Qualified Teachers" color="emerald" delay={0.1} />
                            <StatCard icon={<Heart className="h-7 w-7" />} value={stats.parents} label="Trusted Parents" color="rose" delay={0.2} />
                            <StatCard icon={<Building2 className="h-7 w-7" />} value={stats.classes} label="Active Classes" color="amber" delay={0.3} />
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="bg-gradient-to-b from-gray-50 to-white py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <div>
                                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">{aboutLabel}</span>
                                <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                                    {aboutTitle}
                                </h2>
                                <p className="mt-6 text-lg leading-relaxed text-gray-600">
                                    {aboutDesc}
                                </p>
                            </div>
                            <div className="relative">
                                <div className="overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                                    <img
                                        src={aboutImage}
                                        alt="School campus"
                                        className="h-[440px] w-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-8 -left-8 hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-7 text-white shadow-2xl transition-transform duration-500 hover:scale-105 sm:block">
                                    <p className="text-4xl font-bold">{stats.students}+</p>
                                    <p className="mt-1 text-sm text-white/80">Happy Students</p>
                                </div>
                                <div className="absolute -top-6 -right-6 hidden rounded-2xl bg-white p-5 shadow-xl sm:block">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                            <Award className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Certified</p>
                                            <p className="text-xs text-gray-500">Education Board</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-14 text-center">
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Our Values</span>
                            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">What We Stand For</h2>
                        </div>
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {values.map((v, i) => {
                                const Icon = iconMap[v.icon] ?? Target;
                                return <ValueCard key={i} icon={<Icon className="h-6 w-6" />} title={v.title} description={v.description} />;
                            })}
                        </div>
                    </div>
                </section>

                {/* Teachers Slider */}
                <section id="teachers" className="bg-gradient-to-b from-white to-gray-50 py-24">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-14 text-center">
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">{teachersLabel}</span>
                            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{teachersTitle}</h2>
                            <p className="mt-4 text-gray-500">{teachersSubtitle}</p>
                        </div>

                        <TeacherSlider
                            teachers={featuredTeachers}
                            founderName={founderName}
                            founderQualification={founderQualification}
                            founderBio={founderBio}
                            founderImage={founderImage}
                        />
                    </div>
                </section>

                {/* Admissions CTA */}
                <section id="admissions" className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-900 to-purple-950 py-24">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1920&q=80')] bg-cover bg-center opacity-10" />
                    <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
                    <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

                    <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
                        {activeSession && (
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md">
                                <Calendar className="h-4 w-4" />
                                Session {activeSession.name} ({activeSession.start_date} - {activeSession.end_date})
                            </div>
                        )}
                        <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                            {admissionsTitle}
                        </h2>
                        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
                            {admissionsDesc}
                        </p>
                        <div className="mt-12 flex flex-wrap justify-center gap-4">
                            <a
                                href={admissionsBtnLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30"
                            >
                                <MessageCircle className="h-5 w-5" />
                                {admissionsBtnText}
                                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-950 py-16">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                                        {school?.logo_url ? (
                                            <img src={school.logo_url} alt={schoolName} className="h-full w-full rounded-xl object-contain" />
                                        ) : (
                                            <GraduationCap className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <span className="text-lg font-bold text-white">{schoolName}</span>
                                </div>
                                <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
                                    {footerDesc}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-300">Contact Information</h4>
                                <div className="mt-6 space-y-4">
                                    {address && (
                                        <div className="flex items-start gap-3 text-sm text-gray-400">
                                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
                                            {address}
                                        </div>
                                    )}
                                    {phone && (
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <Phone className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                                            {phone}
                                        </div>
                                    )}
                                    {email && (
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <Mail className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                                            {email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-gray-300">Quick Links</h4>
                                <div className="mt-6 space-y-3">
                                    <a href="#about" className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white">About Us</a>
                                    <a href="#teachers" className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white">Our Teachers</a>
                                    <a href="#admissions" className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white">Admissions</a>
                                    <Link href={route('login')} className="block text-sm text-gray-400 transition-colors duration-200 hover:text-white">Portal Login</Link>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} {footerText}. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes slowZoom {
                    from { transform: scale(1); }
                    to { transform: scale(1.08); }
                }
            `}</style>
        </>
    );
}

function StatCard({ icon, value, label, color, delay }) {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div
            className="group rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ animation: `fadeIn 0.6s ease-out ${delay}s both` }}
        >
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${colorMap[color] ?? colorMap.indigo} transition-transform duration-300 group-hover:scale-110`}>
                {icon}
            </div>
            <p className="text-4xl font-bold text-gray-900">{value}</p>
            <p className="mt-2 text-sm font-medium text-gray-500">{label}</p>
        </div>
    );
}

function ValueCard({ icon, title, description }) {
    return (
        <div
            className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ animation: 'fadeIn 0.6s ease-out both' }}
        >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-transform duration-300 group-hover:scale-110">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
    );
}

function TeacherSlider({ teachers, founderName, founderQualification, founderBio, founderImage }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const trackRef = useRef(null);

    const items = [
        // Founder as first slide
        {
            name: founderName,
            qualification: founderQualification,
            bio: founderBio,
            photo_url: founderImage,
            isFounder: true,
        },
        ...teachers,
    ];

    const next = () => setIndex((prev) => (prev + 1) % items.length);
    const prev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    useEffect(() => {
        if (paused || items.length <= 1) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [paused, items.length]);

    return (
        <div
            className="mt-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative overflow-hidden rounded-3xl">
                <div
                    ref={trackRef}
                    className="flex transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {items.map((teacher, i) => (
                        <div key={i} className="w-full flex-shrink-0 px-4">
                            <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-10 shadow-md">
                                <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
                                    <div className="relative mb-6 sm:mb-0 sm:mr-8">
                                        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white shadow-lg transition-transform duration-300 hover:scale-105">
                                            {teacher.photo_url ? (
                                                <img src={teacher.photo_url} alt={teacher.name} className="h-full w-full object-cover" />
                                            ) : (
                                                teacher.name?.charAt(0) ?? '?'
                                            )}
                                        </div>
                                        {teacher.isFounder && (
                                            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg">
                                                <Award className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {teacher.isFounder && (
                                            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                <Sparkles className="h-3 w-3" />
                                                Founder
                                            </span>
                                        )}
                                        <h3 className="text-2xl font-bold text-gray-900">{teacher.name ?? '—'}</h3>
                                        <p className="mt-1.5 text-sm font-medium text-indigo-600">{teacher.qualification ?? '—'}</p>
                                        <p className="mt-4 text-sm leading-relaxed text-gray-600">{teacher.bio ?? 'Dedicated educator committed to student excellence.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {items.length > 1 && (
                <div className="mt-8 flex items-center justify-center gap-6">
                    <button
                        onClick={prev}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex gap-2.5">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                    i === index ? 'w-10 bg-indigo-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={next}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
