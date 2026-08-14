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
    const chartHeight = 180;
    const labelArea = 50;
    const yAxisArea = 36;
    const barWidth = Math.min(32, Math.max(14, 180 / data.length));
    const gap = Math.max(16, Math.min(32, 240 / data.length));
    const padding = 16;
    const totalWidth = data.length * (barWidth + gap) + yAxisArea + padding * 2;
    const svgWidth = Math.max(totalWidth, 340);
    const svgHeight = chartHeight + labelArea + padding;
    const gridSteps = 4;
    const chartLeft = yAxisArea + padding;
    const chartRight = svgWidth - padding;
    const chartTop = padding;
    const chartBottom = chartTop + chartHeight;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
            <div className="mt-5 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full"
                    style={{ minWidth: svgWidth }}
                >
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
                        </linearGradient>
                    </defs>

                    {/* Y-axis gridlines and labels */}
                    {Array.from({ length: gridSteps + 1 }).map((_, i) => {
                        const gy = chartTop + (chartHeight / gridSteps) * i;
                        const val = Math.round(max - (max / gridSteps) * i);
                        return (
                            <g key={`grid-${i}`}>
                                <line
                                    x1={chartLeft}
                                    y1={gy}
                                    x2={chartRight}
                                    y2={gy}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className="text-gray-150 dark:text-gray-700"
                                    strokeDasharray={i === gridSteps ? '0' : '3 3'}
                                />
                                <text
                                    x={chartLeft - 8}
                                    y={gy + 3}
                                    textAnchor="end"
                                    className="fill-gray-400 text-[9px] dark:fill-gray-500"
                                >
                                    {val}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {data.map((item, index) => {
                        const x = chartLeft + index * (barWidth + gap) + gap / 2;
                        const barHeight = max > 0 ? (item.value / max) * (chartHeight - 10) : 0;
                        const y = chartBottom - barHeight;

                        return (
                            <g key={index} className="transition-opacity hover:opacity-80">
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={Math.min(barWidth / 2, 4)}
                                    fill="url(#barGradient)"
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 5}
                                    textAnchor="middle"
                                    className="fill-gray-600 text-[10px] font-semibold dark:fill-gray-300"
                                >
                                    {item.value}
                                </text>
                                <text
                                    x={x + barWidth / 2}
                                    y={chartBottom + 16}
                                    textAnchor="end"
                                    transform={`rotate(-30, ${x + barWidth / 2}, ${chartBottom + 16})`}
                                    className="fill-gray-400 text-[9px] dark:fill-gray-500"
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
