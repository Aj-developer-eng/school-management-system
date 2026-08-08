import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import Pagination from '@/Components/Ui/Pagination';
import FlashMessages from '@/Components/FlashMessages';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { MessageSquarePlus, Eye, Clock, CheckCircle2, XCircle, Loader2, Inbox } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', icon: Clock, color: 'amber', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    in_progress: { label: 'In Progress', icon: Loader2, color: 'sky', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
    resolved: { label: 'Resolved', icon: CheckCircle2, color: 'emerald', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    closed: { label: 'Closed', icon: XCircle, color: 'gray', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const priorityBadge = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    normal: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    high: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    urgent: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function Index({ requests, stats, filters, role }) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const applyFilter = (val) => {
        setStatusFilter(val);
        router.get(route('special-requests.index'), { status: val }, { preserveScroll: true, preserveState: true });
    };

    return (
        <AuthenticatedLayout
            title="Special Requests"
            breadcrumbs={[{ label: 'Special Requests' }]}
        >
            <FlashMessages />

            <div className="space-y-6">
                {/* Stats + New button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <StatCard label="Total" value={stats.total} color="indigo" />
                        <StatCard label="Pending" value={stats.pending} color="amber" />
                        <StatCard label="In Progress" value={stats.in_progress} color="sky" />
                        <StatCard label="Resolved" value={stats.resolved} color="emerald" />
                        <StatCard label="Closed" value={stats.closed} color="gray" />
                    </div>
                    {role === 'parent' && (
                        <Link
                            href={route('special-requests.create')}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                            <MessageSquarePlus className="h-4 w-4" />
                            New Request
                        </Link>
                    )}
                </div>

                {/* Status filter tabs */}
                <div className="flex flex-wrap gap-2">
                    <FilterTab label="All" active={statusFilter === ''} onClick={() => applyFilter('')} />
                    <FilterTab label="Pending" active={statusFilter === 'pending'} onClick={() => applyFilter('pending')} />
                    <FilterTab label="In Progress" active={statusFilter === 'in_progress'} onClick={() => applyFilter('in_progress')} />
                    <FilterTab label="Resolved" active={statusFilter === 'resolved'} onClick={() => applyFilter('resolved')} />
                    <FilterTab label="Closed" active={statusFilter === 'closed'} onClick={() => applyFilter('closed')} />
                </div>

                {/* Requests list */}
                <Card>
                    {requests.data.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {requests.data.map((r) => {
                                const cfg = statusConfig[r.status] ?? statusConfig.pending;
                                const StatusIcon = cfg.icon;
                                return (
                                    <Link
                                        key={r.id}
                                        href={route('special-requests.show', r.id)}
                                        className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${cfg.badge}`}>
                                            <StatusIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                                    {r.subject}
                                                </p>
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge[r.priority] ?? priorityBadge.normal}`}>
                                                    {r.priority}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                                                {r.body}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                                {role === 'admin' && (
                                                    <span>From: {r.parent?.user?.name ?? '—'}</span>
                                                )}
                                                {r.student?.user?.name && (
                                                    <span>Student: {r.student.user.name}</span>
                                                )}
                                                {r.assignee?.name && (
                                                    <span>Directed to: {r.assignee.name}</span>
                                                )}
                                                <span>{r.created_at}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-shrink-0 items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                                                {cfg.label}
                                            </span>
                                            <Eye className="h-4 w-4 text-gray-300" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">
                                No requests found.
                            </p>
                            {role === 'parent' && (
                                <Link
                                    href={route('special-requests.create')}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    <MessageSquarePlus className="h-4 w-4" />
                                    Create your first request
                                </Link>
                            )}
                        </div>
                    )}
                    <Pagination {...requests} />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
        <div className={`rounded-lg px-3 py-2 text-center ${colors[color] ?? colors.indigo}`}>
            <span className="block text-lg font-bold">{value}</span>
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
}

function FilterTab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );
}
