export default function SimpleBarChart({ data, title, emptyMessage = 'No data available.' }) {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    const max = Math.max(...data.map((d) => d.value));
    const chartHeight = 200;
    const barWidth = Math.min(64, 600 / data.length);
    const gap = 16;
    const totalWidth = data.length * (barWidth + gap);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
            <div className="mt-4 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${Math.max(totalWidth, 300)} ${chartHeight + 60}`}
                    className="w-full"
                    style={{ minWidth: totalWidth }}
                >
                    {data.map((item, index) => {
                        const x = index * (barWidth + gap) + gap / 2;
                        const barHeight = max > 0 ? (item.value / max) * (chartHeight - 40) : 0;
                        const y = chartHeight - barHeight;

                        return (
                            <g key={index}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={4}
                                    className="fill-indigo-500 dark:fill-indigo-400"
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 8}
                                    textAnchor="middle"
                                    className="fill-gray-700 text-[10px] font-medium dark:fill-gray-300"
                                >
                                    {item.value}
                                </text>
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    transform={`rotate(-30, ${x + barWidth / 2}, ${chartHeight + 20})`}
                                    className="fill-gray-500 text-[10px] dark:fill-gray-400"
                                >
                                    {item.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
