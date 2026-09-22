import { useEffect, useState } from 'react';

const DEFAULT_SEGMENTS = [
    { key: 'pending', label: 'Pending', ring: 'stroke-amber-500', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300' },
    { key: 'started', label: 'Started', ring: 'stroke-sky-500', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-300' },
    { key: 'completed', label: 'Completed', ring: 'stroke-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
];

export default function StatusDonutChart({ stats, title = 'Assignment Status', segments }) {
    const SEGMENTS = segments ?? DEFAULT_SEGMENTS;
    const [grown, setGrown] = useState(false);
    const [settled, setSettled] = useState(false);
    const [hovered, setHovered] = useState(null);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setGrown(true));
        const timeout = setTimeout(() => setSettled(true), 1300);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, []);

    const values = SEGMENTS.map((seg) => ({ ...seg, value: Number(stats?.[seg.key]) || 0 }));
    const total = values.reduce((sum, seg) => sum + seg.value, 0);

    const RADIUS = 48;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    let offset = 0;
    const arcs = values.map((seg) => {
        const len = total > 0 ? (seg.value / total) * CIRCUMFERENCE : 0;
        const arc = { ...seg, len, offset };
        offset += len;
        return arc;
    });

    return (
        <div className="animate-fade-in flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700/60 dark:text-gray-300">
                    {total} total
                </span>
            </div>

            <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row">
                <div className="relative shrink-0" onMouseLeave={() => setHovered(null)}>
                    <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
                        <circle
                            cx="60"
                            cy="60"
                            r={RADIUS}
                            fill="none"
                            strokeWidth="13"
                            className="stroke-gray-100 dark:stroke-gray-700/50"
                        />
                        {arcs.map((arc, index) => (
                            <circle
                                key={arc.key}
                                cx="60"
                                cy="60"
                                r={RADIUS}
                                fill="none"
                                strokeLinecap="butt"
                                className={`${arc.ring} transition-all duration-700 ease-out ${arc.value === 0 ? 'opacity-0' : 'opacity-100'}`}
                                style={{
                                    strokeWidth: hovered === index ? 17 : 13,
                                    strokeDasharray: grown ? `${arc.len} ${CIRCUMFERENCE - arc.len}` : `0 ${CIRCUMFERENCE}`,
                                    strokeDashoffset: -arc.offset,
                                    transitionDelay: grown && !settled ? `${index * 160}ms` : '0ms',
                                    cursor: arc.value > 0 ? 'pointer' : 'default',
                                }}
                                onMouseEnter={() => arc.value > 0 && setHovered(index)}
                            />
                        ))}
                    </svg>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums dark:text-white">
                            {total}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Total
                        </span>
                    </div>
                </div>

                <ul className="w-full max-w-[200px] space-y-2">
                    {arcs.map((arc, index) => (
                        <li
                            key={arc.key}
                            onMouseEnter={() => arc.value > 0 && setHovered(index)}
                            className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 transition-colors duration-200 ${hovered === index ? 'bg-gray-50 dark:bg-gray-700/40' : ''}`}
                        >
                            <span className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <span className={`h-2 w-2 rounded-full ${arc.dot}`} aria-hidden="true" />
                                {arc.label}
                            </span>
                            <span className={`text-xs font-semibold tabular-nums ${arc.text}`}>
                                {arc.value}
                                <span className="ml-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                    {total > 0 ? `${Math.round((arc.value / total) * 100)}%` : '0%'}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}