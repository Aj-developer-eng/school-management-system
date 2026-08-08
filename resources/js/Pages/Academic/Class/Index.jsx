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

export default function Index({ classes, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('classes.index');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'level', label: 'Level' },
        {
            key: 'active_from_session',
            label: 'Introduced In',
            render: (row) => row.active_from_session?.name ?? '—',
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
                    {can('classes.update') && <EditLink routeName="classes.edit" params={row.id} />}
                    {can('classes.delete') && <DeleteButton routeName="classes.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Classes"
            breadcrumbs={[{ label: 'Classes' }]}
            actions={can('classes.create') && <CreateButton routeName="classes.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or code…" />
                </div>
                <DataTable columns={columns} rows={classes} />
                <Pagination {...classes} />
            </Card>
        </AuthenticatedLayout>
    );
}
