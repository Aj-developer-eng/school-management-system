import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import Pagination from '@/Components/Ui/Pagination';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ScrollText, Search, Filter, X, User, Calendar, Activity, Users, Clock } from 'lucide-react';

const actionConfig = {
    created: { label: 'Created', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    updated: { label: 'Updated', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
    deleted: { label: 'Deleted', badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
    started: { label: 'Started', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    completed: { label: 'Completed', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
    reset: { label: 'Reset', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
    responded: { label: 'Responded', badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
    recorded: { label: 'Recorded', badge: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
    submitted: { label: 'Submitted', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
};

export default function Index({ logs, stats, modules, actions, filters }) {
    const [form, setForm] = useState({
        module: filters.module ?? '',
        action: filters.action ?? '',
        user_id: filters.user_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        search: filters.search ?? '',
    });

    const applyFilters = () => {
        router.get(route('activity-logs.index'), form, { preserveScroll: true, preserveState: true });
    };

    const clearFilters = () => {
        setForm({ module: '', action: '', user_id: '', date_from: '', date_to: '', search: '' });
        router.get(route('activity-logs.index'), {}, { preserveScroll: true, preserveState: true });
    };

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <AuthenticatedLayout
            title="Audit Logs"
            breadcrumbs={[{ label: 'Audit Logs' }]}
        >
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard icon={Activity} label="Total Activities" value={stats.total} color="indigo" />
                    <StatCard icon={Clock} label="Today" value={stats.today} color="amber" />
                    <StatCard icon={Calendar} label="This Week" value={stats.this_week} color="sky" />
                    <StatCard icon={Users} label="Active Users" value={stats.unique_users} color="emerald" />
                </div>

                {/* Filters */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Module</label>
                            <select
                                value={form.module}
                                onChange={(e) => setForm({ ...form, module: e.target.value })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="">All modules</option>
                                {modules.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Action</label>
                            <select
                                value={form.action}
                                onChange={(e) => setForm({ ...form, action: e.target.value })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="">All actions</option>
                                {actions.map((a) => (
                                    <option key={a} value={a}>{actionConfig[a]?.label ?? a}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={form.search}
                                    onChange={(e) => setForm({ ...form, search: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                    placeholder="Search description…"
                                    className="w-full rounded-lg border-gray-300 pl-9 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Date From</label>
                            <input
                                type="date"
                                value={form.date_from}
                                onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Date To</label>
                            <input
                                type="date"
                                value={form.date_to}
                                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={applyFilters}
                                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Logs table */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Activity Log</h3>
                        </div>
                    </div>
                    {logs.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">User</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Module</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Action</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">IP Address</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date / Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {logs.data.map((log) => {
                                        const cfg = actionConfig[log.action] ?? { label: log.action, badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
                                        return (
                                            <tr key={log.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                            {log.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                                        </span>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-gray-100">{log.user?.name ?? 'System'}</p>
                                                            <p className="text-xs text-gray-400">{log.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                        {log.module}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {log.description}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400">
                                                    {log.ip_address ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400">
                                                    {log.created_at}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <ScrollText className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">No activity logs found.</p>
                        </div>
                    )}
                    <Pagination {...logs} />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    };
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${colors[color] ?? colors.indigo}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}
