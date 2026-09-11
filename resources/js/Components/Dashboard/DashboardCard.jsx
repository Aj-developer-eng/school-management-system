import { useEffect, useState } from 'react';

const accentMap = {
    indigo: 'from-indigo-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    sky: 'from-sky-500 to-cyan-500',
    violet: 'from-violet-500 to-purple-500',
};

const pillMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
};

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Smoothly counts a numeric value up from 0 on mount. Skipped for
 * non-numeric values (e.g. "Rs 1,234", class names) and for users who
 * prefer reduced motion.
 */
function useCountUp(target) {
    const end = Number(target);
    const animatable = Number.isFinite(end) && String(target).trim() !== '' && !prefersReducedMotion();

    const [display, setDisplay] = useState(animatable ? 0 : target);

    useEffect(() => {
        if (!animatable) {
            setDisplay(target);
            return undefined;
        }

        let frame;
        const start = performance.now();
        const duration = 1100;
        const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setDisplay(Math.round(end * easeOutExpo(progress)));
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [animatable, end, target]);

    return display;
}

export default function DashboardCard({ title, value, subtitle, color = 'indigo', delay = 0 }) {
    const animatedValue = useCountUp(value);
    const accent = accentMap[color] ?? accentMap.indigo;
    const pill = pillMap[color] ?? pillMap.indigo;

    return (
        <div
            className="group animate-rise relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            style={{ animationDelay: `${delay}ms` }}
        >
            <span
                className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent} opacity-80 transition-all duration-300 group-hover:h-1.5 group-hover:opacity-100`}
                aria-hidden="true"
            />
            <div
                className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.18]`}
                aria-hidden="true"
            />

            <p className="relative text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</p>
            <p className="relative mt-2 text-3xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white">
                {animatedValue}
            </p>
            {subtitle && (
                <span className={`relative mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                    {subtitle}
                </span>
            )}
        </div>
    );
}
