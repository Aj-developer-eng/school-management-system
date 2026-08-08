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

export default function Index({ concessions, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('fee-concessions.index');

    const columns = [
        {
            key: 'student',
            label: 'Student',
            render: (row) => row.student?.user?.name ?? '—',
        },
        {
            key: 'concession_type',
            label: 'Type',
            render: (row) => row.concession_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        },
        {
            key: 'discount',
            label: 'Discount',
            render: (row) => {
                if (row.percentage) return `${row.percentage}%`;
                if (row.flat_amount) return `Rs ${Number(row.flat_amount).toLocaleString()}`;
                return '—';
            },
        },
        {
            key: 'fee_structure',
            label: 'Fee Structure',
            render: (row) => row.fee_structure?.name ?? 'All',
        },
        {
            key: 'reason',
            label: 'Reason',
            render: (row) => row.reason ?? '—',
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
                    {can('fee-concessions.update') && <EditLink routeName="fee-concessions.edit" params={row.id} />}
                    {can('fee-concessions.delete') && <DeleteButton routeName="fee-concessions.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Fee Concessions"
            breadcrumbs={[{ label: 'Fees' }, { label: 'Concessions' }]}
            actions={can('fee-concessions.create') && <CreateButton routeName="fee-concessions.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by student or type…" />
                </div>
                <DataTable columns={columns} rows={concessions} />
                <Pagination {...concessions} />
            </Card>
        </AuthenticatedLayout>
    );
}
