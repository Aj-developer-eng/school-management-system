import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    GraduationCap,
    Globe,
    MapPin,
    Mail,
    CheckCircle2,
    Quote,
    TrendingUp,
    Building2,
    Sparkles,
    Home,
    PenTool,
    Layers,
    Languages,
    Landmark,
    BadgeCheck,
    Network,
    Earth,
    Award,
    Users,
    Target,
    Lightbulb,
    HandHeart,
    Heart,
    LayoutDashboard,
    Calendar,
    MessageCircle,
} from 'lucide-react';

const iconMap = {
    BookOpen, Award, Users, Target, Lightbulb, HandHeart, GraduationCap, Heart, Building2, Sparkles,
    Globe, LayoutDashboard, TrendingUp, CheckCircle2, MapPin, Calendar, MessageCircle,
    Home, PenTool, Layers, Languages, Landmark, BadgeCheck, Network, Earth,
};

export default function Landing({ school, cms, activeSession }) {
    const schoolName = school?.school_name ?? 'EdSkills Global';
    const address = school ? `${school.address ?? ''}, ${school.city ?? ''}`.trim().replace(/,$/, '') : '';
    const email = school?.email ?? 'admissions@edskillsglobal.edu';
    const footerText = school?.footer_text ?? schoolName;
    const bannerImage = cms?.banner_image_url || 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80';

    const c = cms ?? {};

    // Hero
    const heroBadge = c.hero_badge_text || (activeSession ? `Admissions Open for ${activeSession.name}` : 'Online & on-site · Pakistan · Dubai · UK');
    const heroTitle = c.hero_title || 'Global pathways to';
    const heroHighlight = c.hero_title_highlight || 'world-class';
    const heroTitleSuffix = c.hero_title_suffix || 'degrees.';
    const heroSubtitle = c.hero_subtitle || 'EdSkills Global prepares students for O/A Levels, SAT, BTEC Pearson qualifications, UK university top-up degrees and IELTS success — with a transparent performance dashboard that shows every step of progress.';
    const heroBtnText = c.hero_button_text || 'Open my dashboard';
    const heroBtnLink = c.hero_button_link || route('login');
    const heroSecondaryBtnText = c.hero_secondary_button_text || 'Explore programs';
    const heroSecondaryBtnLink = c.hero_secondary_button_link || '#programs';
    const heroStats = c.hero_stats?.length ? c.hero_stats : [
        { label: 'Programs', value: '7+' },
        { label: 'Countries', value: '3' },
        { label: 'Progression rate', value: '94%' },
    ];
    const heroFloatLabel = c.hero_float_label || 'Live progress';
    const heroFloatValue = c.hero_float_value || 'IELTS 7.5';
    const heroFloatSub = c.hero_float_sub || 'Mock band · on target';

    // Programs
    const programsLabel = c.programs_label || 'Programs';
    const programsTitle = c.programs_title || 'Every pathway, from school entrance to';
    const programsTitleHighlight = c.programs_title_highlight || 'UK graduation';
    const programsLinkText = c.programs_link_text || 'See how we measure progress';
    const programs = c.programs?.length ? c.programs : [
        { icon: 'BookOpen', title: 'O/A Level Coaching', description: 'Structured Cambridge and Pearson O/A Level preparation with subject specialists, mock exams and progress tracking.', badge: 'Cambridge · Pearson' },
        { icon: 'Home', title: 'O/A Level Homeschooling', description: 'Personalized homeschooling plan with a clear roadmap toward Ivy League and top-tier UK university admissions.', badge: 'Personalized' },
        { icon: 'PenTool', title: 'SAT Coaching', description: 'Comprehensive SAT preparation covering math, evidence-based reading and writing, with timed practice tests and score tracking.', badge: 'Test prep' },
        { icon: 'Award', title: 'BTEC Pearson Level 3', description: 'Practical, career-focused qualification that builds the skills universities and employers value.', badge: 'Career-focused' },
        { icon: 'Layers', title: 'Pearson Level 5 Extended Diploma', description: 'Advanced diploma pathways in Business, Law and Information Technology — stepping stones to UK top-up degrees.', badge: 'Advanced diploma' },
        { icon: 'GraduationCap', title: 'UK Top-up Degrees', description: "Complete your bachelor's or master's through partner UK universities with online and blended support.", badge: 'UK partners' },
        { icon: 'Languages', title: 'IELTS Coaching', description: 'Targeted training in reading, writing, listening and speaking to help you hit your target band score.', badge: 'Band targets' },
    ];

    // Locations
    const locationsLabel = c.locations_label || 'Where we are';
    const locationsTitle = c.locations_title || 'Study online, on-site or';
    const locationsTitleHighlight = c.locations_title_highlight || 'across borders';
    const locationsDesc = c.locations_description || 'All programs are delivered online and on-site, with offices in Pakistan, Dubai and the UK to support admissions, mentoring and university placement.';
    const locations = c.locations?.length ? c.locations : [
        { title: 'Pakistan', description: 'On-site campuses and study centers', icon: 'MapPin' },
        { title: 'Dubai', description: 'Face-to-face and blended learning hub', icon: 'Building2' },
        { title: 'United Kingdom', description: 'University pathway coordination office', icon: 'Landmark' },
    ];

    // Dashboard
    const dashboardLabel = c.dashboard_label || 'Student Dashboard';
    const dashboardTitle = c.dashboard_title || 'Your academic journey, in';
    const dashboardTitleHighlight = c.dashboard_title_highlight || 'one view';
    const dashboardDesc = c.dashboard_description || 'Track assessment scores, attendance, IELTS mock bands, BTEC unit progress and your UK university pathway — all updated in real time.';
    const dashboardFeatures = c.dashboard_features?.length ? c.dashboard_features : [
        'Course-by-course progress across O/A Levels, SAT, BTEC and diplomas',
        'Assessment trends with target tracking for IELTS, SAT and Pearson units',
        'Monthly attendance for online and on-site sessions',
        'Personal mentor notes and university pathway milestones',
    ];
    const dashboardBtnText = c.dashboard_button_text || 'Open my dashboard';
    const dashboardBtnLink = c.dashboard_button_link || route('login');
    const dp = c.dashboard_preview ?? {};
    const dashboardPreview = {
        course: dp.course ?? 'BTEC Level 3 · 2026',
        units: dp.units ?? '12/18',
        unitsPct: dp.units_pct ?? 67,
        attendance: dp.attendance ?? '94%',
        attendancePct: dp.attendance_pct ?? 94,
        ielts: dp.ielts ?? '7.5',
        ieltsPct: dp.ielts_pct ?? 83,
        mentor_note: dp.mentor_note ?? 'Consistent unit submissions — ready to begin the UK top-up application this term.',
    };
    const dashboardPreviewLabel = c.dashboard_preview_label || 'Pathway Snapshot';
    const dashboardPreviewStatus = c.dashboard_preview_status || 'On track';
    const dashboardPreviewUnitsLabel = c.dashboard_preview_units_label || 'Units';
    const dashboardPreviewAttendanceLabel = c.dashboard_preview_attendance_label || 'Attendance';
    const dashboardPreviewIeltsLabel = c.dashboard_preview_ielts_label || 'IELTS Mock';
    const dashboardPreviewMentorLabel = c.dashboard_preview_mentor_label || 'Mentor note';

    // Why Us
    const whyUsLabel = c.why_us_label || `Why ${schoolName}`;
    const whyUsTitle = c.why_us_title || 'A different kind of';
    const whyUsTitleHighlight = c.why_us_title_highlight || 'education partner';
    const whyUs = c.why_us?.length ? c.why_us : [
        { title: 'Pearson-aligned delivery', description: 'BTEC and Pearson diploma content taught by certified trainers who understand examiner expectations.', icon: 'BadgeCheck' },
        { title: 'UK university network', description: "Direct top-up degree pathways with UK university partners for graduation and master's programs.", icon: 'Network' },
        { title: 'Global + local support', description: 'Online classes backed by on-site offices in Pakistan, Dubai and the UK for admissions and mentoring.', icon: 'Earth' },
    ];

    // Testimonials
    const testimonialsLabel = c.testimonials_label || 'Student voices';
    const testimonialsTitle = c.testimonials_title || 'Results, in their';
    const testimonialsTitleHighlight = c.testimonials_title_highlight || 'own words';
    const testimonials = c.testimonials?.length ? c.testimonials : [
        { name: 'Ayesha R.', program: 'SAT Coaching', location: 'Lahore', quote: 'The dashboard kept me honest. I could see my SAT practice scores climbing every week, and my mentor adjusted the plan whenever I plateaued.' },
        { name: 'Omar K.', program: 'BTEC Pearson Level 3', location: 'Dubai', quote: 'BTEC Level 3 with EdSkills gave me a direct route into a UK top-up degree. The unit tracking meant I always knew exactly what was left.' },
        { name: 'Fatima S.', program: 'IELTS Coaching', location: 'Online', quote: 'I went from a 6.0 to a 7.5 IELTS band in four months. The mock band tracking and speaking practice made all the difference.' },
    ];

    // CTA
    const ctaBadge = c.cta_badge_text || 'Begin your journey';
    const ctaTitle = c.cta_title || 'Your future deserves a partner that takes it';
    const ctaTitleHighlight = c.cta_title_highlight || 'seriously';
    const ctaDesc = c.cta_description || 'Create your student account in seconds, explore your sample dashboard, and talk to admissions about the right pathway.';
    const ctaBtnText = c.cta_button_text || 'Create student account';
    const ctaBtnLink = c.cta_button_link || route('login');
    const ctaSecondaryBtnText = c.cta_secondary_button_text || 'I already have an account';
    const ctaSecondaryBtnLink = c.cta_secondary_button_link || route('login');

    // Footer
    const footerDesc = c.footer_description || 'Global pathways from O/A Levels, SAT, BTEC and IELTS to UK university graduation — online and on-site.';
    const footerProgramsLabel = c.footer_programs_label || 'Programs';
    const footerInstituteLabel = c.footer_institute_label || 'Institute';
    const footerInstituteLinks = c.footer_institute_links?.length ? c.footer_institute_links : [
        { label: 'About', link: '#' },
        { label: 'Admissions', link: '#' },
        { label: 'University Pathways', link: '#' },
        { label: 'Student Dashboard', link: route('login') },
    ];
    const footerReachLabel = c.footer_reach_label || 'Reach us';
    const footerModeText = c.footer_mode_text || 'Online & On-site';
    const footerTagline = c.footer_tagline || "Crafted for tomorrow's leaders.";

    const navLinks = [
        { label: 'Programs', href: '#programs' },
        { label: 'Locations', href: '#locations' },
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Why us', href: '#why-us' },
        { label: 'Contact', href: '#contact' },
    ];

    return (
        <>
            <Head title={`${schoolName} — O/A Levels, BTEC, SAT & UK`} />
            <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
                {/* Header */}
                <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href={route('landing')} className="flex items-center gap-2.5" aria-label={`${schoolName} home`}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
                                {school?.logo_url ? (
                                    <img src={school.logo_url} alt={schoolName} className="h-full w-full rounded-xl object-contain" />
                                ) : (
                                    <GraduationCap className="h-5 w-5" />
                                )}
                            </span>
                            <span className="font-serif text-xl font-semibold tracking-tight text-gray-900">
                                {schoolName.split(' ')[0]} <span className="italic text-gold">{schoolName.split(' ').slice(1).join(' ') || 'Global'}</span>
                            </span>
                        </Link>
                        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
                            {navLinks.map((link) => (
                                <a key={link.href} href={link.href} className="text-sm font-medium text-gray-500 transition-colors duration-300 hover:text-gray-900">
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                        <div className="hidden items-center gap-3 md:flex">
                            <Link href={route('login')} className="text-sm font-medium text-gray-500 transition-colors duration-300 hover:text-gray-900">
                                Sign in
                            </Link>
                            <a href="#cta" className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                                Apply now
                            </a>
                        </div>
                    </div>
                </header>

                <main>
                    {/* Hero */}
                    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-28 lg:pt-40">
                        <div className="pointer-events-none absolute -top-32 right-0 h-[480px] w-[480px] rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
                        <div className="pointer-events-none absolute -left-40 top-64 h-[360px] w-[360px] rounded-full bg-navy/10 blur-3xl" aria-hidden="true" />
                        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-16">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gray-900">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                                    {heroBadge}
                                </p>
                                <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                                    {heroTitle}{' '}
                                    <span className="italic text-gold">{heroHighlight}</span>{' '}
                                    {heroTitleSuffix}
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
                                    {heroSubtitle}
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-4">
                                    <a
                                        href={heroBtnLink}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-8 py-3 text-base font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        {heroBtnText}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={heroSecondaryBtnLink}
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-transparent px-8 py-3 text-base font-medium text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:border-gray-400"
                                    >
                                        {heroSecondaryBtnText}
                                    </a>
                                </div>
                                <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-gray-200 pt-8">
                                    {heroStats.map((stat, i) => (
                                        <div key={i}>
                                            <dd className="font-serif text-3xl font-semibold text-gray-900">{stat.value}</dd>
                                            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <div className="relative">
                                <div className="relative overflow-hidden rounded-3xl shadow-hero">
                                    <img
                                        alt="Students collaborating on a study session"
                                        className="h-[420px] w-full object-cover sm:h-[520px] lg:h-[560px]"
                                        src={bannerImage}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" aria-hidden="true" />
                                </div>
                                <div className="absolute -bottom-6 -left-4 w-64 animate-float-slow rounded-2xl border border-gray-200 bg-white p-5 shadow-float sm:-left-8">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">{heroFloatLabel}</p>
                                        <TrendingUp className="h-4 w-4 text-gold" />
                                    </div>
                                    <p className="mt-3 font-serif text-2xl font-semibold text-gray-900">{heroFloatValue}</p>
                                    <p className="text-sm text-gray-500">{heroFloatSub}</p>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full w-[83%] rounded-full bg-gold" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Programs */}
                    <section id="programs" className="py-20 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-medium uppercase tracking-widest text-gold">{programsLabel}</p>
                                    <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                        {programsTitle}{' '}
                                        <span className="italic text-gold">{programsTitleHighlight}</span>.
                                    </h2>
                                </div>
                                <a href="#dashboard" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900 transition-colors hover:text-gold">
                                    {programsLinkText}
                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </a>
                            </div>
                            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {programs.map((program, i) => {
                                    const Icon = iconMap[program.icon] ?? BookOpen;
                                    return (
                                        <article
                                            key={i}
                                            className="group h-full rounded-2xl border border-gray-200 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover"
                                        >
                                            <div className="flex items-start justify-between">
                                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors duration-300 group-hover:bg-gold/15 group-hover:text-gold">
                                                    <Icon className="h-6 w-6" />
                                                </span>
                                                {program.badge && (
                                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                                                        {program.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="mt-6 text-2xl font-semibold leading-snug text-gray-900">{program.title}</h3>
                                            <p className="mt-3 text-sm leading-relaxed text-gray-500">{program.description}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Locations */}
                    <section id="locations" className="bg-gray-50/50 py-20 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="mx-auto max-w-2xl text-center">
                                <p className="text-xs font-medium uppercase tracking-widest text-gold">{locationsLabel}</p>
                                <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {locationsTitle}{' '}
                                    <span className="italic text-gold">{locationsTitleHighlight}</span>.
                                </h2>
                                <p className="mt-5 text-lg leading-relaxed text-gray-500">{locationsDesc}</p>
                            </div>
                            <div className="mt-14 grid gap-6 md:grid-cols-3">
                                {locations.map((loc, i) => {
                                    const Icon = iconMap[loc.icon] ?? MapPin;
                                    return (
                                        <article
                                            key={i}
                                            className="group h-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover"
                                        >
                                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy transition-colors duration-300 group-hover:bg-gold/15 group-hover:text-gold">
                                                <Icon className="h-7 w-7" />
                                            </span>
                                            <h3 className="mt-6 text-2xl font-semibold text-gray-900">{loc.title}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-gray-500">{loc.description}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Dashboard Preview */}
                    <section id="dashboard" className="relative overflow-hidden bg-navy py-20 text-navy-foreground lg:py-28">
                        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
                        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-gold/5 blur-3xl" aria-hidden="true" />
                        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-gold">{dashboardLabel}</p>
                                <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {dashboardTitle}{' '}
                                    <span className="italic text-gold">{dashboardTitleHighlight}</span>.
                                </h2>
                                <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-foreground/70">{dashboardDesc}</p>
                                <ul className="mt-8 space-y-4">
                                    {dashboardFeatures.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                                            <span className="text-sm leading-relaxed text-navy-foreground/80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href={dashboardBtnLink}
                                    className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-base font-medium text-gold-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {dashboardBtnText}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </div>
                            <div>
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-hero backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-widest text-navy-foreground/60">{dashboardPreviewLabel}</p>
                                            <p className="mt-1 font-serif text-2xl font-semibold text-white">{dashboardPreview.course}</p>
                                        </div>
                                        <span className="rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-medium text-gold">{dashboardPreviewStatus}</span>
                                    </div>
                                    <div className="mt-8 space-y-6">
                                        <div>
                                            <div className="flex items-baseline justify-between">
                                                <p className="text-sm text-navy-foreground/70">{dashboardPreviewUnitsLabel}</p>
                                                <p className="font-serif text-2xl font-semibold text-white">{dashboardPreview.units}</p>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${dashboardPreview.unitsPct}%` }} aria-hidden="true" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline justify-between">
                                                <p className="text-sm text-navy-foreground/70">{dashboardPreviewAttendanceLabel}</p>
                                                <p className="font-serif text-2xl font-semibold text-white">{dashboardPreview.attendance}</p>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${dashboardPreview.attendancePct}%` }} aria-hidden="true" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline justify-between">
                                                <p className="text-sm text-navy-foreground/70">{dashboardPreviewIeltsLabel}</p>
                                                <p className="font-serif text-2xl font-semibold text-white">{dashboardPreview.ielts}</p>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${dashboardPreview.ieltsPct}%` }} aria-hidden="true" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                                        <p className="text-xs font-medium uppercase tracking-widest text-navy-foreground/60">{dashboardPreviewMentorLabel}</p>
                                        <p className="mt-2 font-serif text-base italic leading-relaxed text-navy-foreground/80">
                                            &ldquo;{dashboardPreview.mentor_note}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Why Us */}
                    <section id="why-us" className="py-20 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="mx-auto max-w-2xl text-center">
                                <p className="text-xs font-medium uppercase tracking-widest text-gold">{whyUsLabel}</p>
                                <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {whyUsTitle}{' '}
                                    <span className="italic text-gold">{whyUsTitleHighlight}</span>.
                                </h2>
                            </div>
                            <div className="mt-14 grid gap-6 md:grid-cols-3">
                                {whyUs.map((item, i) => {
                                    const Icon = iconMap[item.icon] ?? Sparkles;
                                    return (
                                        <article
                                            key={i}
                                            className="group h-full rounded-2xl border border-gray-200 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover"
                                        >
                                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors duration-300 group-hover:bg-gold/15 group-hover:text-gold">
                                                <Icon className="h-6 w-6" />
                                            </span>
                                            <h3 className="mt-6 text-2xl font-semibold leading-snug text-gray-900">{item.title}</h3>
                                            <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.description}</p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section className="bg-gray-50/50 py-20 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="mx-auto max-w-2xl text-center">
                                <p className="text-xs font-medium uppercase tracking-widest text-gold">{testimonialsLabel}</p>
                                <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                    {testimonialsTitle}{' '}
                                    <span className="italic text-gold">{testimonialsTitleHighlight}</span>.
                                </h2>
                            </div>
                            <div className="mt-14 grid gap-6 md:grid-cols-3">
                                {testimonials.map((t, i) => (
                                    <figure
                                        key={i}
                                        className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                                    >
                                        <Quote className="h-8 w-8 text-gold/60" />
                                        <blockquote className="mt-5 flex-1 font-serif text-lg italic leading-relaxed text-gray-900">
                                            &ldquo;{t.quote}&rdquo;
                                        </blockquote>
                                        <figcaption className="mt-6 border-t border-gray-200 pt-5">
                                            <p className="font-medium text-gray-900">{t.name}</p>
                                            <p className="mt-0.5 text-sm text-gray-500">{t.program} · {t.location}</p>
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section id="cta" className="py-20 lg:py-28">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 text-center text-navy-foreground shadow-hero sm:px-16 lg:py-24">
                                <div className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
                                <div className="pointer-events-none absolute -bottom-40 -right-20 h-[300px] w-[300px] rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
                                <div className="relative mx-auto max-w-2xl">
                                    <p className="text-xs font-medium uppercase tracking-widest text-gold">{ctaBadge}</p>
                                    <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                                        {ctaTitle}{' '}
                                        <span className="italic text-gold">{ctaTitleHighlight}</span>.
                                    </h2>
                                    <p className="mt-5 text-lg leading-relaxed text-navy-foreground/70">{ctaDesc}</p>
                                    <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                                        <a
                                            href={ctaBtnLink}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-3 text-base font-medium text-gold-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            {ctaBtnText}
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                        <a
                                            href={ctaSecondaryBtnLink}
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                                        >
                                            {ctaSecondaryBtnText}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer id="contact" className="border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
                        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
                            <div>
                                <Link href={route('landing')} className="flex items-center gap-2.5" aria-label={`${schoolName} home`}>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
                                        {school?.logo_url ? (
                                            <img src={school.logo_url} alt={schoolName} className="h-full w-full rounded-xl object-contain" />
                                        ) : (
                                            <GraduationCap className="h-5 w-5" />
                                        )}
                                    </span>
                                    <span className="font-serif text-xl font-semibold tracking-tight text-gray-900">
                                        {schoolName.split(' ')[0]} <span className="italic text-gold">{schoolName.split(' ').slice(1).join(' ') || 'Global'}</span>
                                    </span>
                                </Link>
                                <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">{footerDesc}</p>
                            </div>
                            <div>
                                <h4 className="font-serif text-lg font-semibold text-gray-900">{footerProgramsLabel}</h4>
                                <ul className="mt-4 space-y-2.5">
                                    {programs.map((p, i) => (
                                        <li key={i}>
                                            <a href="#programs" className="text-sm text-gray-500 transition-colors duration-300 hover:text-gray-900">{p.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-serif text-lg font-semibold text-gray-900">{footerInstituteLabel}</h4>
                                <ul className="mt-4 space-y-2.5">
                                    {footerInstituteLinks.map((link, i) => (
                                        <li key={i}>
                                            {link.link?.startsWith('#') || link.link?.startsWith('/') ? (
                                                <a href={link.link} className="text-sm text-gray-500 transition-colors duration-300 hover:text-gray-900">{link.label}</a>
                                            ) : (
                                                <Link href={link.link} className="text-sm text-gray-500 transition-colors duration-300 hover:text-gray-900">{link.label}</Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-serif text-lg font-semibold text-gray-900">{footerReachLabel}</h4>
                                <ul className="mt-4 space-y-3">
                                    {email && (
                                        <li className="flex items-center gap-2.5 text-sm text-gray-500">
                                            <Mail className="h-4 w-4 text-gold" />
                                            {email}
                                        </li>
                                    )}
                                    {address && (
                                        <li className="flex items-center gap-2.5 text-sm text-gray-500">
                                            <MapPin className="h-4 w-4 text-gold" />
                                            {address}
                                        </li>
                                    )}
                                    <li className="flex items-center gap-2.5 text-sm text-gray-500">
                                        <Globe className="h-4 w-4 text-gold" />
                                        {footerModeText}
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-8 sm:flex-row">
                            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} {footerText}. All rights reserved.</p>
                            <p className="font-serif text-sm italic text-gray-500">{footerTagline}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
