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

export default function Index({ teachers, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('teachers.index');

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {row.photo_url ? (
                            <img src={row.photo_url} alt={row.user?.name} className="h-full w-full object-cover" />
                        ) : (
                            row.user?.name?.charAt(0)?.toUpperCase()
                        )}
                    </span>
                    <span>{row.user?.name}</span>
                </div>
            ),
        },
        { key: 'email', label: 'Email', render: (row) => row.user?.email },
        { key: 'employee_code', label: 'Employee Code' },
        { key: 'qualification', label: 'Qualification' },
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
                    {can('teachers.update') && <EditLink routeName="teachers.edit" params={row.id} />}
                    {can('teachers.delete') && <DeleteButton routeName="teachers.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Teachers"
            breadcrumbs={[{ label: 'Teachers' }]}
            actions={can('teachers.create') && <CreateButton routeName="teachers.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name, email or code…" />
                </div>
                <DataTable columns={columns} rows={teachers} />
                <Pagination {...teachers} />
            </Card>
        </AuthenticatedLayout>
    );
}
