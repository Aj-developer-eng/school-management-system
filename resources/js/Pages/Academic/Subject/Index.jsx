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

export default function Index({ subjects, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('subjects.index');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        {
            key: 'school_classes',
            label: 'Classes',
            render: (row) =>
                row.school_classes?.length
                    ? row.school_classes.map((c) => c.name).join(', ')
                    : '—',
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
                    {can('subjects.update') && <EditLink routeName="subjects.edit" params={row.id} />}
                    {can('subjects.delete') && <DeleteButton routeName="subjects.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Subjects"
            breadcrumbs={[{ label: 'Subjects' }]}
            actions={can('subjects.create') && <CreateButton routeName="subjects.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or code…" />
                </div>
                <DataTable columns={columns} rows={subjects} />
                <Pagination {...subjects} />
            </Card>
        </AuthenticatedLayout>
    );
}
