import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { BarChart3 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusColors = {
    unpaid: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function Index({ invoices, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('fee-invoices.index');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        router.get(route('fee-invoices.index'), { search: filters.search ?? '', status: e.target.value }, { preserve: true, preserveState: true });
    };

    const columns = [
        {
            key: 'invoice_number',
            label: 'Invoice #',
            render: (row) => (
                <Link href={route('fee-invoices.show', row.id)} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                    {row.invoice_number}
                </Link>
            ),
        },
        {
            key: 'student',
            label: 'Student',
            render: (row) => row.student?.user?.name ?? '—',
        },
        {
            key: 'school_class',
            label: 'Class',
            render: (row) => row.school_class?.name ?? '—',
        },
        {
            key: 'total_amount',
            label: 'Total',
            render: (row) => `Rs ${Number(row.total_amount).toLocaleString()}`,
        },
        {
            key: 'paid_amount',
            label: 'Paid',
            render: (row) => `Rs ${Number(row.paid_amount).toLocaleString()}`,
        },
        {
            key: 'balance',
            label: 'Balance',
            render: (row) => `Rs ${Number(row.balance).toLocaleString()}`,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[row.status] ?? statusColors.unpaid}`}>
                    {row.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('fee-invoices.update') && row.status !== 'cancelled' && (
                        <button
                            onClick={() => {
                                if (confirm('Cancel this invoice?')) {
                                    router.patch(route('fee-invoices.cancel', row.id));
                                }
                            }}
                            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400"
                        >
                            Cancel
                        </button>
                    )}
                    {can('fee-invoices.delete') && <DeleteButton routeName="fee-invoices.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Fee Invoices"
            breadcrumbs={[{ label: 'Fees' }, { label: 'Invoices' }]}
            actions={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('fee-reports.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <BarChart3 size={16} />
                        Reports
                    </Link>
                    {can('fee-invoices.create') && <CreateButton routeName="fee-invoices.create" />}
                </div>
            }
        >
            <Card>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by invoice # or student…" />
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                        <option value="">All statuses</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <DataTable columns={columns} rows={invoices} />
                <Pagination {...invoices} />
            </Card>
        </AuthenticatedLayout>
    );
}
