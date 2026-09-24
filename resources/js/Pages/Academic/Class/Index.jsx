import { useEffect, useState } from 'react';
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
import { Search, X } from 'lucide-react';

export default function Index({ classes, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('classes.index');
    const [studentsClass, setStudentsClass] = useState(null);

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'level', label: 'Level' },
        {
            key: 'students_count',
            label: 'Students',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => setStudentsClass(row)}
                    title="View students"
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
                >
                    {row.students_count ?? 0}
                </button>
            ),
        },
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

            <StudentsModal classItem={studentsClass} onClose={() => setStudentsClass(null)} />
        </AuthenticatedLayout>
    );
}

function StudentsModal({ classItem, onClose }) {
    const [query, setQuery] = useState('');

    // Reset the search when a different class is opened.
    useEffect(() => {
        setQuery('');
    }, [classItem?.id]);

    if (!classItem) return null;

    const students = (classItem.students_list ?? []).filter((s) =>
        (s.student_name ?? '').toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Students — {classItem.name}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {students.length} of {(classItem.students_list ?? []).length} enrolled
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search student by name…"
                            className="w-full rounded-lg border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto p-4 pt-0">
                    {students.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {students.map((s) => (
                                <li key={s.student_id} className="py-2">
                                    <Link
                                        href={route('students.show', s.student_id)}
                                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-800"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {s.student_name}
                                            </p>
                                            <p className="truncate text-xs text-gray-400">
                                                {s.admission_number ?? 'No admission #'}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                            {s.section_name ?? '—'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            {(classItem.students_list ?? []).length === 0
                                ? 'No students enrolled in this class.'
                                : `No students match "${query}".`}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
