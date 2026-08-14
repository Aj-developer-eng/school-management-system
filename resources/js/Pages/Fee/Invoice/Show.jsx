import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import DeleteButton from '@/Components/Ui/DeleteButton';
import { useAuth } from '@/utils/authorization';
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
                                Student: <span className="font-medium">{invoice.student?.user?.name}</span>
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
                                Issued: {invoice.issue_date} · Due: {invoice.due_date}
                            </p>
                            <a
                                href={route('fee-invoices.pdf', invoice.id)}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Download size={16} />
                                Download PDF
                            </a>
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
                                            <td className="py-3 text-gray-700 dark:text-gray-300">{p.payment_date}</td>
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
