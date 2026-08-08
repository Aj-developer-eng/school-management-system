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

export default function Index({ parents, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('parents.index');

    const columns = [
        { key: 'name', label: 'Name', render: (row) => row.user?.name },
        { key: 'email', label: 'Email', render: (row) => row.user?.email },
        { key: 'cnic', label: 'CNIC' },
        { key: 'occupation', label: 'Occupation' },
        { key: 'children', label: 'Children', render: (row) => row.students?.length ?? 0 },
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
                    {can('parents.update') && <EditLink routeName="parents.edit" params={row.id} />}
                    {can('parents.delete') && <DeleteButton routeName="parents.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Parents"
            breadcrumbs={[{ label: 'Parents' }]}
            actions={can('parents.create') && <CreateButton routeName="parents.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name, email or CNIC…" />
                </div>
                <DataTable columns={columns} rows={parents} />
                <Pagination {...parents} />
            </Card>
        </AuthenticatedLayout>
    );
}
