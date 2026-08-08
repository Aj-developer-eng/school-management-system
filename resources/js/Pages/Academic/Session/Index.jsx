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

export default function Index({ sessions, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('academic-sessions.index');

    const columns = [
        { key: 'name', label: 'Name' },
        {
            key: 'start_date',
            label: 'Duration',
            render: (row) => `${row.start_date} — ${row.end_date}`,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} label={row.is_active ? 'Active' : 'Inactive'} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('academic-sessions.update') && <EditLink routeName="academic-sessions.edit" params={row.id} />}
                    {can('academic-sessions.delete') && <DeleteButton routeName="academic-sessions.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Academic Sessions"
            breadcrumbs={[{ label: 'Academic Sessions' }]}
            actions={can('academic-sessions.create') && <CreateButton routeName="academic-sessions.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name…" />
                </div>
                <DataTable columns={columns} rows={sessions} />
                <Pagination {...sessions} />
            </Card>
        </AuthenticatedLayout>
    );
}
