import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import FlashMessages from '@/Components/FlashMessages';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, User, Calendar, MessageSquare, Reply } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', icon: Clock, badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
    in_progress: { label: 'In Progress', icon: Loader2, badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400', dot: 'bg-sky-500' },
    resolved: { label: 'Resolved', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
    closed: { label: 'Closed', icon: XCircle, badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
};

const typeLabels = {
    general: 'General',
    leave: 'Leave Application',
    complaint: 'Complaint',
    meeting: 'Meeting Request',
    fee: 'Fee Related',
    other: 'Other',
};

export default function Show({ specialRequest, canRespond }) {
    const { data, setData, patch, processing } = useForm({
        status: specialRequest.status,
        admin_response: specialRequest.admin_response ?? '',
    });

    const cfg = statusConfig[specialRequest.status] ?? statusConfig.pending;
    const StatusIcon = cfg.icon;

    const submit = (e) => {
        e.preventDefault();
        patch(route('special-requests.respond', specialRequest.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title={`Request: ${specialRequest.subject}`}
            breadcrumbs={[
                { label: 'Special Requests', href: route('special-requests.index') },
                { label: specialRequest.subject },
            ]}
        >
            <FlashMessages />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href={route('special-requests.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Requests
                </Link>

                {/* Request detail card */}
                <Card>
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${cfg.badge}`}>
                                <StatusIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {specialRequest.subject}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                                        {cfg.label}
                                    </span>
                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        {typeLabels[specialRequest.request_type] ?? specialRequest.request_type}
                                    </span>
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                        {specialRequest.priority} priority
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Meta info */}
                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <MetaItem icon={User} label="From" value={specialRequest.parent?.user?.name ?? '—'} />
                            <MetaItem icon={User} label="Student" value={specialRequest.student?.user?.name ?? 'General'} />
                            <MetaItem icon={Calendar} label="Submitted" value={specialRequest.created_at} />
                            <MetaItem icon={MessageSquare} label="Directed to" value={specialRequest.assignee?.name ?? 'General (Anyone)'} />
                        </div>

                        {/* Body */}
                        <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                            <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Request Details</h4>
                            <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                                {specialRequest.body}
                            </p>
                        </div>

                        {/* Admin response */}
                        {specialRequest.admin_response && (
                            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                                <div className="mb-2 flex items-center gap-2">
                                    <Reply className="h-4 w-4 text-indigo-600" />
                                    <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                                        Response from {specialRequest.assignee?.name ?? 'Administration'}
                                    </h4>
                                </div>
                                <p className="whitespace-pre-wrap text-sm text-indigo-800 dark:text-indigo-300">
                                    {specialRequest.admin_response}
                                </p>
                                {specialRequest.responded_at && (
                                    <p className="mt-2 text-xs text-indigo-400">
                                        {specialRequest.responded_at}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Admin/Teacher response form */}
                {canRespond && (
                    <Card>
                        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Manage Request
                            </h3>
                        </div>
                        <form onSubmit={submit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(statusConfig).map(([key, c]) => {
                                        const Icon = c.icon;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('status', key)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                    data.status === key
                                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Response Message
                                </label>
                                <textarea
                                    value={data.admin_response}
                                    onChange={(e) => setData('admin_response', e.target.value)}
                                    rows={4}
                                    placeholder="Write a response to the parent…"
                                    className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Reply className="h-4 w-4" />
                                    Save Response
                                </button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function MetaItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">{label}:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
        </div>
    );
}
