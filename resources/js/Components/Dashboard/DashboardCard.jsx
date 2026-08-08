export default function DashboardCard({ title, value, subtitle, color = 'indigo' }) {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
        sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && (
                <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[color]}`}>
                    {subtitle}
                </span>
            )}
        </div>
    );
}
