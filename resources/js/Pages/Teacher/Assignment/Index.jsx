import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';

export default function Index({ assignments, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('teacher-assignments.index');

    const columns = [
        { key: 'teacher', label: 'Teacher', render: (row) => row.teacher?.user?.name },
        { key: 'academic_session', label: 'Session', render: (row) => row.academic_session?.name },
        { key: 'school_class', label: 'Class', render: (row) => row.school_class?.name },
        { key: 'section', label: 'Section', render: (row) => row.section?.name },
        { key: 'subject', label: 'Subject', render: (row) => row.subject?.name },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('teacher-assignments.update') && <EditLink routeName="teacher-assignments.edit" params={row.id} />}
                    {can('teacher-assignments.delete') && <DeleteButton routeName="teacher-assignments.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Teacher Subject Assignments"
            breadcrumbs={[{ label: 'Teacher Assignments' }]}
            actions={can('teacher-assignments.create') && <CreateButton routeName="teacher-assignments.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by teacher or subject…" />
                </div>
                <DataTable columns={columns} rows={assignments} />
                <Pagination {...assignments} />
            </Card>
        </AuthenticatedLayout>
    );
}
