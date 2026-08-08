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

export default function Index({ users, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('users.index');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'roles', label: 'Roles', render: (row) => row.roles?.map((r) => r.name).join(', ') },
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
                    {can('users.update') && <EditLink routeName="users.edit" params={row.id} />}
                    {can('users.delete') && <DeleteButton routeName="users.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Users"
            breadcrumbs={[{ label: 'Users' }]}
            actions={can('users.create') && <CreateButton routeName="users.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or email…" />
                </div>
                <DataTable columns={columns} rows={users} />
                <Pagination {...users} />
            </Card>
        </AuthenticatedLayout>
    );
}
