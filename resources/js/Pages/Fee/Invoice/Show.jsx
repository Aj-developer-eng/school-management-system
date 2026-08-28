import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import DeleteButton from '@/Components/Ui/DeleteButton';
import { useAuth } from '@/utils/authorization';
import { formatDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { Download } from 'lucide-react';


const statusColors = {
    unpaid: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function Show({ invoice }) {
    const { can } = useAuth();

    return (
        <AuthenticatedLayout
            title={`Invoice ${invoice.invoice_number}`}
            breadcrumbs={[
                { label: 'Fee Invoices', href: route('fee-invoices.index') },
                { label: invoice.invoice_number },
            ]}
        >
            <div className="space-y-6">
                {/* Invoice header */}
                <Card>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {invoice.invoice_number}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Student12345: <span className="font-medium">{invoice.student?.user?.name}</span>
                                {' · '}{invoice.school_class?.name}
                                {' · '}{invoice.academic_session?.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Fee: {invoice.fee_structure?.name}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[invoice.status] ?? statusColors.unpaid}`}>
                                {invoice.status}
                            </span>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Issued: {formatDate(invoice.issue_date)} · Due: {formatDate(invoice.due_date)}
                            </p>
                            <div className="mt-3 flex items-center justify-end gap-2">
                                {can('fee-invoices.update') && invoice.status !== 'cancelled' && (
                                    <Link
                                        href={route('fee-invoices.edit', invoice.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Edit
                                    </Link>
                                )}
                                <a
                                    href={route('fee-invoices.pdf', invoice.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Amount summary */}
                <Card>
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                                Rs {Number(invoice.total_amount).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Concession</p>
                            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                                Rs {Number(invoice.concession_amount).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
                            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                Rs {Number(invoice.paid_amount).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                            <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
                                Rs {Number(invoice.balance).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Concession details */}
                {invoice.concessions?.length > 0 && (
                    <Card>
                        <h3 className="p-6 pb-0 text-sm font-semibold text-gray-700 dark:text-gray-200">Concession Details</h3>
                        <div className="p-6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Discount</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Reason</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.concessions.map((c) => (
                                        <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                            <td className="py-3 text-gray-700 dark:text-gray-300">
                                                {c.concession_type?.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                                            </td>
                                            <td className="py-3 font-medium text-amber-600 dark:text-amber-400">
                                                {c.percentage ? `${c.percentage}%` : `Rs ${Number(c.flat_amount).toLocaleString()}`}
                                            </td>
                                            <td className="py-3 text-gray-500 dark:text-gray-400">{c.reason ?? '—'}</td>
                                            <td className="py-3">
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    c.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Payments */}
                <Card>
                    <div className="flex items-center justify-between p-6 pb-0">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Payment History</h3>
                        {can('fee-payments.create') && invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                            <Link
                                href={route('fee-payments.create', { invoice_id: invoice.id })}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Record Payment
                            </Link>
                        )}
                    </div>
                    <div className="p-6">
                        {invoice.payments?.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Amount</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Method</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Reference</th>
                                        <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Evidence</th>
                                        <th className="py-2 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.payments.map((p) => (
                                        <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{formatDate(p.payment_date)}</td>
                                            <td className="py-3 font-medium text-gray-900 dark:text-gray-100">Rs {Number(p.amount).toLocaleString()}</td>
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{p.payment_method}</td>
                                            <td className="py-3 text-gray-500 dark:text-gray-400">{p.transaction_reference ?? '—'}</td>
                                            <td className="py-3">
                                                {p.evidence_url ? (
                                                    <a href={p.evidence_url} target="_blank" rel="noopener noreferrer">
                                                        <img src={p.evidence_url} alt="Payment evidence" className="h-12 w-12 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                {can('fee-payments.delete') && (
                                                    <DeleteButton routeName="fee-payments.destroy" params={p.id} />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No payments recorded yet.</p>
                        )}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
