import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const statusColors = {
    unpaid: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function formatRs(value) {
    return `Rs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function SummaryCard({ label, value, color }) {
    const colors = {
        indigo: 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10',
        emerald: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
        amber: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
        rose: 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10',
    };
    return (
        <div className={`rounded-xl border p-5 ${colors[color] ?? colors.indigo}`}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}

export default function Index({
    summary,
    statusBreakdown,
    collectionByMethod,
    topOutstanding,
    classWiseSummary,
    filters,
    academicSessions,
    classes,
}) {
    const [sessionId, setSessionId] = useState(filters.academic_session_id ?? '');
    const [classId, setClassId] = useState(filters.school_class_id ?? '');

    const applyFilters = () => {
        router.get(route('fee-reports.index'), {
            academic_session_id: sessionId || undefined,
            school_class_id: classId || undefined,
        }, { preserve: true, preserveState: true });
    };

    return (
        <AuthenticatedLayout
            title="Fee Reports"
            breadcrumbs={[{ label: 'Fees' }, { label: 'Reports' }]}
        >
            <div className="space-y-6">
                {/* Filters */}
                <Card>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Session</label>
                            <select
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">All sessions</option>
                                {Object.entries(academicSessions ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">All classes</option>
                                {Object.entries(classes ?? {}).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Apply Filters
                        </button>
                    </div>
                </Card>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Total Invoiced" value={formatRs(summary.total_invoiced)} color="indigo" />
                    <SummaryCard label="Total Collected" value={formatRs(summary.total_collected)} color="emerald" />
                    <SummaryCard label="Total Concession" value={formatRs(summary.total_concession)} color="amber" />
                    <SummaryCard label="Outstanding" value={formatRs(summary.total_outstanding)} color="rose" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Status breakdown */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Invoice Status Breakdown</h3>
                            <div className="mt-4 space-y-3">
                                {statusBreakdown.length > 0 ? statusBreakdown.map((row) => (
                                    <div key={row.status} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[row.status] ?? statusColors.unpaid}`}>
                                                {row.status}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{row.count} invoice(s)</span>
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRs(row.total)}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No data available.</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Collection by method */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Collection by Payment Method</h3>
                            <div className="mt-4 space-y-3">
                                {collectionByMethod.length > 0 ? collectionByMethod.map((row) => (
                                    <div key={row.method} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <div>
                                            <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                                                {row.method.replace(/_/g, ' ')}
                                            </span>
                                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{row.count} payment(s)</span>
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRs(row.total)}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No payments recorded.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Class-wise summary */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Class-wise Summary</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Invoices</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Invoiced</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Concession</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Collected</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classWiseSummary.length > 0 ? classWiseSummary.map((row) => (
                                        <tr key={row.class_name} className="border-b border-gray-100 dark:border-gray-700/50">
                                            <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{row.class_name}</td>
                                            <td className="py-3 text-right text-gray-700 dark:text-gray-300">{row.invoice_count}</td>
                                            <td className="py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(row.total_invoiced)}</td>
                                            <td className="py-3 text-right text-amber-600 dark:text-amber-400">{formatRs(row.total_concession)}</td>
                                            <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">{formatRs(row.total_collected)}</td>
                                            <td className="py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(row.outstanding)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">No data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                {/* Top outstanding invoices */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Top Outstanding Invoices</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Student</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Paid</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Balance</th>
                                        <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topOutstanding.length > 0 ? topOutstanding.map((inv) => (
                                        <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                            <td className="py-3 font-medium text-indigo-600 dark:text-indigo-300">{inv.invoice_number}</td>
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{inv.student?.user?.name ?? '—'}</td>
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{inv.school_class?.name ?? '—'}</td>
                                            <td className="py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                            <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">{formatRs(inv.paid_amount)}</td>
                                            <td className="py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                            <td className="py-3 text-center">
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="py-4 text-center text-gray-500 dark:text-gray-400">No outstanding invoices.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
