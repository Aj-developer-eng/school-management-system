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
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';

export default function Index({ students, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('students.index');

    const columns = [
        { key: 'admission_number', label: 'Admission #' },
        { key: 'name', label: 'Name', render: (row) => row.user?.name },
        { key: 'email', label: 'Email', render: (row) => row.user?.email },
        {
            key: 'current_class',
            label: 'Current Class',
            render: (row) => {
                const e = row.enrollments?.[0];
                return e ? `${e.school_class?.name} ${e.section?.name} (${e.academic_session?.name})` : '—';
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '150px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Link
                        href={route('students.show', row.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                        title="View Parent"
                    >
                        <Eye className="h-4 w-4" />
                    </Link>
                    {can('students.update') && <EditLink routeName="students.edit" params={row.id} />}
                    {can('students.delete') && <DeleteButton routeName="students.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Students"
            breadcrumbs={[{ label: 'Students' }]}
            actions={can('students.create') && <CreateButton routeName="students.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name, email or admission #…" />
                </div>
                <DataTable columns={columns} rows={students} />
                <Pagination {...students} />
            </Card>
        </AuthenticatedLayout>
    );
}
