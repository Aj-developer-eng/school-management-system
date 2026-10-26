import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import FlashMessages from '@/Components/FlashMessages';
import { router } from '@inertiajs/react';
import { UserCheck, UserX, Users, Inbox, Clock, CheckCircle2, XCircle } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', icon: Clock },
    approved: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle2 },
    rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', icon: XCircle },
};

export default function Index({ requests = [], users = [] }) {
    return (
        <AuthenticatedLayout
            title="Registration Requests"
            breadcrumbs={[{ label: 'Registration Requests' }]}
        >
            <FlashMessages />

            <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {requests.length} request{requests.length === 1 ? '' : 's'}
                    <Card>
                        <div className="px-6 py-12 text-center">
                            <Inbox className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">No registration requests.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((r) => {
                            const cfg = statusConfig[r.status] ?? statusConfig.pending;
                            const StatusIcon = cfg.icon;
                            return (
                                <Card key={r.id} className="p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{r.name}</h3>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{r.email}</p>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                {r.phone && <span>Phone: {r.phone}</span>}
                                                {r.program && <span>Program: {r.program}</span>}
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    Assigned: {r.assigned_user?.name || 'Unassigned'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <select
                                                value={r.assigned_user_id || ''}
                                                onChange={(e) => router.patch(route('registration-requests.assign', r.id), { assigned_user_id: e.target.value || null })}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Unassigned</option>
                                                {users.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            {r.assigned_user_id && r.status === 'pending' && (
                                                <button
                                                    onClick={() => router.patch(route('registration-requests.approve', r.id))}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                    Approve
                                                </button>
                                            )}
                                            {r.status === 'pending' && (
                                                <button
                                                    onClick={() => router.patch(route('registration-requests.reject', r.id))}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
" 
                </p>

                {requests.length === 0 ? (
" 

