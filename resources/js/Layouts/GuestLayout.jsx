import { BookOpen, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

const features = [
    { icon: BookOpen, label: 'Smart Academics', description: 'Classes, tests, results and reports in one place.' },
    { icon: Users, label: 'Connected Community', description: 'Teachers, students and parents working together.' },
    { icon: ShieldCheck, label: 'Secure & Role-Based', description: 'Every user sees exactly what they should.' },
];

export default function GuestLayout({ children }) {
    const { school } = usePage().props;
    const schoolName = school?.name ?? 'EduSkill';
    const year = new Date().getFullYear();

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Branding panel (desktop) */}
            <aside className="relative hidden w-[46%] max-w-2xl overflow-hidden bg-gradient-to-br from-navy via-indigo-950 to-navy lg:flex lg:flex-col lg:justify-between">
                {/* Animated glow orbs */}
                <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-float-slow" />
                <div className="pointer-events-none absolute -bottom-36 -right-20 h-[26rem] w-[26rem] rounded-full bg-violet-600/20 blur-3xl animate-float-slow [animation-delay:1.5s]" />
                <div className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float-slow [animation-delay:2.5s]" />
                <GraduationCap
                    className="pointer-events-none absolute right-12 top-24 h-16 w-16 text-white/5 animate-float-slow [animation-delay:0.8s]"
                    aria-hidden="true"
                />
                <BookOpen
                    className="pointer-events-none absolute bottom-44 right-44 h-12 w-12 text-white/5 animate-float-slow [animation-delay:2s]"
                    aria-hidden="true"
                />

                {/* Brand */}
                <div className="relative z-10 p-12 animate-fade-in">
                    <Link href="/" className="inline-flex items-center gap-3">
                        {school?.logo_url ? (
                            <img
                                src={school.logo_url}
                                alt={schoolName}
                                className="h-12 w-12 rounded-xl bg-white/10 object-contain p-1.5 ring-1 ring-white/20"
                            />
                        ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/40">
                                <GraduationCap className="h-7 w-7 text-gold" />
                            </span>
                        )}
                        <span className="text-lg font-semibold tracking-wide text-white">{schoolName}</span>
                    </Link>
                </div>
                {/* Pitch */}
                <div className="relative z-10 space-y-8 px-12">
                    <h1 className="animate-rise font-serif text-4xl leading-tight text-white xl:text-5xl">
                        Shape bright futures,
                        <span className="block text-gold">one classroom at a time.</span>
                    </h1>

                    <p className="max-w-md animate-rise text-sm leading-relaxed text-indigo-200/80 [animation-delay:150ms]">
                        The complete school management platform — attendance, fees, tests, results and communication,
                        all in one elegant place.
                    </p>

                    <ul className="space-y-5">
                        {features.map((feature, index) => (
                            <li
                                key={feature.label}
                                className="flex animate-rise items-center gap-4"
                                style={{ animationDelay: `${300 + index * 130}ms` }}
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                                    <feature.icon className="h-5 w-5 text-gold" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                                    <p className="text-xs text-indigo-200/70">{feature.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center justify-between px-12 text-xs text-indigo-300/60 animate-fade-in">
                    <span className="inline-flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-gold/70" />
                        Secure, role-based access
                    </span>
                    <span>© {year} {schoolName}</span>
                </div>
            </aside>

            {/* Form panel */}
            <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
                {/* Mobile brand */}
                <Link href="/" className="mb-10 flex animate-fade-in items-center gap-3 lg:hidden">
                    {school?.logo_url ? (
                        <img
                            src={school.logo_url}
                            alt={schoolName}
                            className="h-10 w-10 rounded-lg bg-gray-100 object-contain p-1 dark:bg-slate-800"
                        />
                    ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy ring-1 ring-gold/40">
                            <GraduationCap className="h-6 w-6 text-gold" />
                        </span>
                    )}
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{schoolName}</span>
                </Link>

                <div className="w-full max-w-md animate-scale-in">{children}</div>

                <p className="mt-10 animate-fade-in text-xs text-gray-400 dark:text-gray-500">
                    <Link href="/" className="transition-colors hover:text-gray-600 dark:hover:text-gray-300">
                        ← Back to website
                    </Link>
                </p>
            </main>
        </div>
    );
}
