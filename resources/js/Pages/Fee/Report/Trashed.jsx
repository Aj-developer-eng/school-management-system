import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Download, Trash2 } from 'lucide-react';

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
        gray: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
    };
    return (
        <div className={`rounded-xl border p-5 ${colors[color] ?? colors.indigo}`}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}

export default function Trashed({ trashedInvoices, orphanedPayments, summary }) {
    return (
        <AuthenticatedLayout
            title="Deleted Invoices & Orphaned Payments"
            breadcrumbs={[
                { label: 'Fees' },
                { label: 'Reports', href: route('fee-reports.index') },
                { label: 'Deleted Records' },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <Trash2 size={18} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        This page shows soft-deleted invoices and orphaned payments. Only Super Admin can access this report.
                    </p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Deleted Invoices" value={summary.trashed_invoice_count} color="gray" />
                    <SummaryCard label="Deleted Total Amount" value={formatRs(summary.trashed_total)} color="gray" />
                    <SummaryCard label="Orphaned Payments" value={summary.orphaned_payment_count} color="rose" />
                    <SummaryCard label="Orphaned Total" value={formatRs(summary.orphaned_total)} color="rose" />
                </div>

                {/* Orphaned payments (payments whose invoice was deleted but payment was not) */}
                {orphanedPayments.length > 0 && (
                    <Card>
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                Orphaned Payments (active payments referencing deleted invoices)
                            </h3>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Payment #</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Invoice</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Method</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Reference</th>
                                            <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orphanedPayments.map((p) => (
                                            <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                                <td className="py-3 text-gray-700 dark:text-gray-300">#{p.id}</td>
                                                <td className="py-3 text-gray-700 dark:text-gray-300">{p.invoice_number}</td>
                                                <td className="py-3 text-gray-500 dark:text-gray-400">{p.payment_date}</td>
                                                <td className="py-3 capitalize text-gray-700 dark:text-gray-300">{p.payment_method.replace(/_/g, ' ')}</td>
                                                <td className="py-3 text-gray-500 dark:text-gray-400">{p.transaction_reference ?? '—'}</td>
                                                <td className="py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Trashed invoices */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deleted Invoices</h3>
                        {trashedInvoices.length > 0 ? (
                            <div className="mt-4 space-y-4">
                                {trashedInvoices.map((inv) => (
                                    <div key={inv.id} className="rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{inv.invoice_number}</span>
                                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {inv.student_name} · {inv.class_name} · {inv.session_name}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    Fee: {inv.fee_structure} · Issued: {inv.issue_date} · Due: {inv.due_date}
                                                </p>
                                                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">
                                                    Deleted: {inv.deleted_at}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-right text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Total: </span>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatRs(inv.total_amount)}</span>
                                                    {' · '}
                                                    <span className="text-gray-500 dark:text-gray-400">Paid: </span>
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatRs(inv.paid_amount)}</span>
                                                    {' · '}
                                                    <span className="text-gray-500 dark:text-gray-400">Balance: </span>
                                                    <span className="font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</span>
                                                </div>
                                                <a
                                                    href={route('fee-reports.trashed.pdf', inv.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                                >
                                                    <Download size={14} />
                                                    Download PDF
                                                </a>
                                            </div>
                                        </div>

                                        {inv.payments.length > 0 && (
                                            <div className="border-t border-gray-100 dark:border-gray-700/50 p-4">
                                                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Payments ({inv.payments.length})</p>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 dark:border-gray-700/50">
                                                            <th className="py-1.5 text-left font-medium text-gray-400">Date</th>
                                                            <th className="py-1.5 text-left font-medium text-gray-400">Method</th>
                                                            <th className="py-1.5 text-left font-medium text-gray-400">Reference</th>
                                                            <th className="py-1.5 text-right font-medium text-gray-400">Amount</th>
                                                            <th className="py-1.5 text-left font-medium text-gray-400">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {inv.payments.map((p) => (
                                                            <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/30">
                                                                <td className="py-2 text-gray-600 dark:text-gray-400">{p.payment_date}</td>
                                                                <td className="py-2 capitalize text-gray-600 dark:text-gray-400">{p.payment_method.replace(/_/g, ' ')}</td>
                                                                <td className="py-2 text-gray-500 dark:text-gray-500">{p.transaction_reference ?? '—'}</td>
                                                                <td className="py-2 text-right font-medium text-gray-700 dark:text-gray-300">{formatRs(p.amount)}</td>
                                                                <td className="py-2">
                                                                    {p.deleted_at ? (
                                                                        <span className="text-xs text-rose-500">Deleted {p.deleted_at}</span>
                                                                    ) : (
                                                                        <span className="text-xs text-amber-600">Orphaned</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No deleted invoices found.</p>
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
