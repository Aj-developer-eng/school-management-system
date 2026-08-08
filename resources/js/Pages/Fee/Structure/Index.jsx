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
import { BarChart3 } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Index({ feeStructures, filters, academicSessions, classes }) {
    const { can } = useAuth();
    const handleSearch = useFilter('fee-structures.index');

    const columns = [
        { key: 'name', label: 'Name' },
        {
            key: 'fee_type',
            label: 'Type',
            render: (row) => row.fee_type,
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => `Rs ${Number(row.amount).toLocaleString()}`,
        },
        {
            key: 'frequency',
            label: 'Frequency',
            render: (row) => row.frequency,
        },
        {
            key: 'academic_session',
            label: 'Session',
            render: (row) => row.academic_session?.name ?? '—',
        },
        {
            key: 'school_class',
            label: 'Class',
            render: (row) => row.school_class?.name ?? '—',
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('fee-structures.update') && <EditLink routeName="fee-structures.edit" params={row.id} />}
                    {can('fee-structures.delete') && <DeleteButton routeName="fee-structures.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Fee Structures"
            breadcrumbs={[{ label: 'Fees' }, { label: 'Fee Structures' }]}
            actions={
                <div className="flex items-center gap-3">
                    {can('fee-invoices.view') && (
                        <Link
                            href={route('fee-reports.index')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <BarChart3 size={16} />
                            Reports
                        </Link>
                    )}
                    {can('fee-structures.create') && <CreateButton routeName="fee-structures.create" />}
                </div>
            }
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or type…" />
                </div>
                <DataTable columns={columns} rows={feeStructures} />
                <Pagination {...feeStructures} />
            </Card>
        </AuthenticatedLayout>
    );
}
