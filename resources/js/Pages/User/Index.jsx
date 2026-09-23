import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import StatusBadge from '@/Components/Ui/StatusBadge';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import PrimaryButton from '@/Components/PrimaryButton';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { BadgeCheck, Download, Undo2 } from 'lucide-react';

const formatRs = (value) =>
    `Rs ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Index({ users, filters, scope, payrollMonth, payrollSummary }) {
    const { can } = useAuth();
    const isHrm = scope === 'hrm';
    const pageTitle = isHrm ? 'HRM' : 'Users';
    const handleSearch = useFilter(isHrm ? 'hrm.index' : 'users.index');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'roles', label: 'Roles', render: (row) => row.roles?.map((r) => r.name).join(', ') },
        ...(isHrm
            ? [
                  {
                      key: 'payroll',
                      label: `Payroll — ${payrollMonth}`,
                      render: (row) => <PayrollCell key={`${row.id}-${payrollMonth}`} user={row} month={payrollMonth} canManage={can('users.update')} />,
                  },
              ]
            : []),
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} />,
        },
        ...(!isHrm
            ? [
                  {
                      key: 'actions',
                      label: 'Actions',
                      width: '120px',
                      render: (row) => (
                          <div className="flex items-center gap-3">
                              {can('users.update') && <EditLink routeName="users.edit" params={row.id} />}
                              {can('users.delete') && <DeleteButton routeName="users.destroy" params={row.id} />}
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    const payAll = () => {
        router.post(route('hrm.payall'), { month: payrollMonth }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title={pageTitle}
            breadcrumbs={[{ label: pageTitle }]}
            actions={
                <>
                    {can('users.create') && <CreateButton routeName="users.create" />}
                    {isHrm && can('users.update') && (
                        <button
                            type="button"
                            onClick={payAll}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                            <BadgeCheck size={16} />
                            Mark all paid
                        </button>
                    )}
                    {isHrm && (
                        <a
                            href={route('hrm.payroll.export', { month: payrollMonth })}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                        >
                            <Download size={16} />
                            CSV
                        </a>
                    )}
                </>
            }
        >
            {isHrm && payrollSummary && (
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SummaryCard label="Staff" value={payrollSummary.staff} tone="indigo" />
                    <SummaryCard label="Paid" value={payrollSummary.paid} tone="emerald" />
                    <SummaryCard label="Unpaid" value={payrollSummary.unpaid} tone="rose" />
                    <SummaryCard label={`Paid amount (${payrollMonth})`} value={formatRs(payrollSummary.paid_amount)} tone="amber" />
                </div>
            )}
            <Card>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or email…" />
                    {isHrm && <MonthSelector month={payrollMonth} />}
                </div>
                <DataTable columns={columns} rows={users} />
                <Pagination {...users} />
            </Card>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, tone }) {
    const tones = {
        indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
        rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
        amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    };

    return (
        <div className={`rounded-xl border p-4 ${tones[tone] ?? tones.indigo}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
    );
}

function MonthSelector({ month }) {
    return (
        <input
            type="month"
            value={month}
            onChange={(e) => {
                if (e.target.value) {
                    router.get(route('hrm.index'), { month: e.target.value }, { preserveScroll: true });
                }
            }}
            className="rounded-lg border-gray-300 bg-white text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
        />
    );
}

function PayrollCell({ user, month, canManage }) {
    const [amount, setAmount] = useState(user.payroll?.amount ?? '0.00');
    const [status, setStatus] = useState(user.payroll?.status ?? 'unpaid');
    const [saving, setSaving] = useState(false);

    const save = (nextStatus, nextAmount = amount) => {
        setSaving(true);
        router.post(
            route('hrm.payroll.update', user.id),
            {
                month,
                amount: nextAmount,
                status: nextStatus,
                notes: user.payroll?.notes ?? '',
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    const isPaid = status === 'paid';

    return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => {
                    // Persist a salary change without toggling the status.
                    if (canManage && amount !== (user.payroll?.amount ?? '0.00')) {
                        save(status, amount);
                    }
                }}
                disabled={!canManage || saving}
                title="Monthly salary"
                className="w-28 rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
            {isPaid ? (
                <button
                    type="button"
                    disabled={!canManage || saving}
                    onClick={() => {
                        setStatus('unpaid');
                        save('unpaid');
                    }}
                    title="Click to mark as unpaid"
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                    <BadgeCheck size={14} />
                    Paid
                    <Undo2 size={12} className="ml-1 opacity-60" />
                </button>
            ) : (
                <button
                    type="button"
                    disabled={!canManage || saving}
                    onClick={() => {
                        setStatus('paid');
                        save('paid');
                    }}
                    title="Click to mark as paid"
                    className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"
                >
                    Unpaid
                </button>
            )}
        </div>
    );
}
