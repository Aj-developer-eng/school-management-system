import { useEffect, useState } from 'react';

export default function EnrollmentBarChart({ data, title, emptyMessage = 'No data available.' }) {
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const todayLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const [grown, setGrown] = useState(false);
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setGrown(true));
        const timeout = setTimeout(() => setSettled(true), 1500);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="animate-fade-in rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{monthYear}</span>
                </div>
                <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    const maxVal = Math.max(...data.map((d) => Number(d.value) || 0), 1);
    const niceMax = Math.max(5, Math.ceil((maxVal * 1.15) / 5) * 5);
    const gridLines = [0, 25, 50, 75, 100];

    return (
        <div className="animate-fade-in rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">{monthYear}</span>
            </div>

            <div className="mt-6 overflow-x-auto">
                <div className="min-w-[480px]">
                    <div className="relative h-56">
                        {/* horizontal grid lines with scale labels */}
                        {gridLines.map((p) => (
                            <div
                                key={p}
                                className="absolute inset-x-0 border-t border-dashed border-gray-100 dark:border-gray-700/50"
                                style={{ bottom: `${p}%` }}
                                aria-hidden="true"
                            >
                                <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[10px] font-medium text-gray-300 dark:bg-gray-800 dark:text-gray-600">
                                    {Math.round((niceMax * p) / 100)}
                                </span>
                            </div>
                        ))}
                        {/* bars */}
                        <div className="absolute inset-0 flex items-end gap-1.5 pr-8 sm:gap-2.5">
                            {data.map((item, index) => {
                                const pct = (Number(item.value) / niceMax) * 100;
                                const delay = grown && !settled ? `${index * 50}ms` : '0ms';
                                return (
                                    <div
                                        key={item.label}
                                        className="group relative flex h-full min-w-[30px] flex-1 items-end justify-center"
                                        title={`${item.label}: ${item.value} student${item.value !== 1 ? 's' : ''}`}
                                    >
                                        <span
                                            className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-gray-700 transition-all duration-700 ease-out dark:text-gray-100"
                                            style={{
                                                bottom: grown ? `calc(${Math.min(pct, 100)}% + 6px)` : '6px',
                                                opacity: grown ? 1 : 0,
                                                transitionDelay: delay,
                                            }}
                                        >
                                            {item.value}
                                        </span>
                                        <div
                                            className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 shadow-sm shadow-indigo-500/10 transition-all duration-700 ease-out group-hover:from-indigo-400 group-hover:to-violet-300 group-hover:shadow-md group-hover:shadow-indigo-500/30"
                                            style={{
                                                height: grown ? `${Math.min(pct, 100)}%` : '0%',
                                                transitionDelay: delay,
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* class labels */}
                    <div className="mt-2 flex gap-1.5 pr-8 sm:gap-2.5">
                        {data.map((item) => (
                            <span
                                key={item.label}
                                className="min-w-[30px] flex-1 truncate text-center text-[10px] font-medium text-gray-400 dark:text-gray-500"
                                title={item.label}
                            >
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-700/50">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                    <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" aria-hidden="true" />
                    Active enrollments
                </span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    As of {todayLabel} · {data.length} class{data.length !== 1 ? 'es' : ''}
                </span>
            </div>
        </div>
    );
}