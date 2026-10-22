import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import { useAuth } from '@/utils/authorization';
import { formatDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const statusColors = {
    announced: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    conducted: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    results_published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function Index({ tests, filters, classes }) {
    const { can } = useAuth();
    const [classId, setClassId] = useState(filters.school_class_id ?? '');

    // Keep the dropdown in sync when the filter is changed from elsewhere
    // (e.g. the browser back button or a shared link).
    useEffect(() => {
        setClassId(filters.school_class_id ?? '');
    }, [filters.school_class_id]);

    const applyFilters = ({ class_id = classId, search = filters.search ?? '' }) => {
        router.get(
            route('tests.index'),
            {
                search: search || undefined,
                school_class_id: class_id || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

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
            key: 'test_date',
            label: 'Date',
            render: (row) => formatDate(row.test_date),
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
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput
                        value={filters.search ?? ''}
                        onChange={(value) => applyFilters({
                            class_id: classId,
                            search: typeof value === 'string' ? value : value.target.value,
                        })}
                        placeholder="Search by title or class…"
                    />
                    <div className="flex items-center gap-2">
                        <label htmlFor="school_class_id" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Class
                        </label>
                        <select
                            id="school_class_id"
                            value={classId}
                            onChange={(e) => {
                                setClassId(e.target.value);
                                applyFilters({ class_id: e.target.value });
                            }}
                            className="rounded-lg border-gray-300 bg-white text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        >
                            <option value="">All Classes</option>
                            {Object.entries(classes ?? {}).map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        {classId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setClassId('');
                                    applyFilters({ class_id: '' });
                                }}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                <DataTable columns={columns} rows={tests} />
                <Pagination {...tests} />
            </Card>
        </AuthenticatedLayout>
    );
}
