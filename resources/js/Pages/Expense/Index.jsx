import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { router } from '@inertiajs/react';

const formatRs = (value) =>
    `Rs ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Index({ expenses, filters, categories, month, summary }) {
    const { can } = useAuth();
    const handleSearch = useFilter('expenses.index');

    const columns = [
        { key: 'expense_date', label: 'Date', render: (row) => row.expense_date?.slice(0, 10) },
        { key: 'title', label: 'Title' },
        {
            key: 'category',
            label: 'Category',
            render: (row) => categories[row.category] ?? row.category,
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => <span className="font-semibold">{formatRs(row.amount)}</span>,
        },
        { key: 'notes', label: 'Notes', render: (row) => row.notes || '—' },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('expenses.update') && <EditLink routeName="expenses.edit" params={row.id} />}
                    {can('expenses.delete') && <DeleteButton routeName="expenses.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    const setFilter = (key, value) => {
        router.get(route('expenses.index'), { ...filters, month, [key]: value }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title="Expenses"
            breadcrumbs={[{ label: 'Expenses' }]}
            actions={can('expenses.create') && <CreateButton routeName="expenses.create" />}
        >
            {summary && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <SummaryCard label={`Total (${month})`} value={formatRs(summary.month_total)} tone="indigo" />
                    <SummaryCard label="Salaries this month" value={formatRs(summary.month_salaries)} tone="amber" />
                    <SummaryCard label="HRM paid payroll" value={formatRs(summary.payroll_paid)} tone="emerald" />
                </div>
            )}

            {summary?.by_category?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {summary.by_category.map((item) => (
                        <button
                            key={item.category}
                            type="button"
                            onClick={() => setFilter('category', filters.category === item.category ? '' : item.category)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                filters.category === item.category
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                        >
                            {item.label}: {formatRs(item.total)}
                        </button>
                    ))}
                </div>
            )}

            <Card>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by title or notes…" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => {
                            if (e.target.value) {
                                router.get(route('expenses.index'), { month: e.target.value, category: filters.category ?? '' }, { preserveScroll: true });
                            }
                        }}
                        className="rounded-lg border-gray-300 bg-white text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    />
                </div>
                <DataTable columns={columns} rows={expenses} />
                <Pagination {...expenses} />
            </Card>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, tone }) {
    const tones = {
        indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300',
        amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    };

    return (
        <div className={`rounded-xl border p-4 ${tones[tone] ?? tones.indigo}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
    );
}