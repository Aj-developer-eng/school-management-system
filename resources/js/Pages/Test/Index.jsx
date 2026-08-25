import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import { useAuth } from '@/utils/authorization';
import { Link } from '@inertiajs/react';

const statusColors = {
    announced: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    conducted: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    results_published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function Index({ tests, filters }) {
    const { can } = useAuth();

    const columns = [
        {
            key: 'title',
            label: 'Title',
            render: (row) => (
                <Link href={route('tests.show', row.id)} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    {row.title}
                </Link>
            ),
        },
        {
            key: 'test_type',
            label: 'Type',
            render: (row) => row.test_type?.label ?? row.test_type,
        },
        {
            key: 'class',
            label: 'Class',
            render: (row) => row.school_class?.name ?? '—',
        },
        {
            key: 'subject',
            label: 'Subject',
            render: (row) => row.subject?.name ?? '—',
        },
        {
            key: 'test_date',
            label: 'Date',
            render: (row) => row.test_date,
        },
        {
            key: 'total_marks',
            label: 'Total Marks',
            render: (row) => Number(row.total_marks),
        },
        {
            key: 'results_count',
            label: 'Results',
            render: (row) => row.results?.length ?? 0,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[row.status?.value ?? row.status] ?? statusColors.announced}`}>
                    {row.status?.label ?? row.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {can('tests.update') && <EditLink routeName="tests.edit" params={row.id} />}
                    {can('tests.delete') && <DeleteButton routeName="tests.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Tests"
            breadcrumbs={[{ label: 'Academics' }, { label: 'Tests' }]}
            actions={can('tests.create') && <CreateButton routeName="tests.create" label="New Test" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={(e) => router.visit(route('tests.index', { search: e.target.value }), { preserveScroll: true, preserveState: true })} placeholder="Search by title, class, or subject…" />
                </div>
                <DataTable columns={columns} rows={tests} />
                <Pagination {...tests} />
            </Card>
        </AuthenticatedLayout>
    );
}
