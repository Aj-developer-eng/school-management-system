import { useEffect, useState } from 'react';

export default function SimpleBarChart({ data, title, emptyMessage = 'No data available.' }) {
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const todayLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const [grown, setGrown] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setGrown(true));
        return () => cancelAnimationFrame(frame);
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

    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="animate-fade-in rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">{monthYear}</span>
            </div>

            <div className="mt-5 space-y-3">
                {data.map((item, index) => {
                    const pct = Math.round((item.value / max) * 100);
                    return (
                        <div key={item.label} className="group flex items-center gap-3">
                            <span className="w-28 shrink-0 truncate text-xs font-medium text-gray-600 dark:text-gray-300" title={item.label}>
                                {item.label}
                            </span>
                            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/50">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700 ease-out group-hover:from-indigo-400 group-hover:to-violet-400"
                                    style={{ width: grown ? `${pct}%` : '0%', transitionDelay: `${index * 60}ms` }}
                                />
                                <span
                                    className={`absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-gray-700 transition-opacity duration-500 dark:text-gray-100 ${grown ? 'opacity-100 delay-500' : 'opacity-0'}`}
                                >
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700/50">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">As of {todayLabel}</span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{data.length} class{data.length !== 1 ? 'es' : ''}</span>
            </div>
        </div>
    );
}
