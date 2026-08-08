import { router } from '@inertiajs/react';
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

export default function Index({ sections, filters, sessions, classes }) {
    const { can } = useAuth();
    const handleSearch = useFilter('sections.index', {
        academic_session_id: filters.academic_session_id,
        school_class_id: filters.school_class_id,
    });

    const updateFilter = (key, value) => {
        const query = { ...filters, [key]: value || undefined, page: undefined };
        router.get(route('sections.index'), query, { preserveState: true, preserveScroll: true });
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'school_class', label: 'Class', render: (row) => row.school_class?.name },
        { key: 'academic_session', label: 'Session', render: (row) => row.academic_session?.name },
        { key: 'room_number', label: 'Room' },
        { key: 'capacity', label: 'Capacity' },
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
                    {can('sections.update') && <EditLink routeName="sections.edit" params={row.id} />}
                    {can('sections.delete') && <DeleteButton routeName="sections.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Sections"
            breadcrumbs={[{ label: 'Sections' }]}
            actions={can('sections.create') && <CreateButton routeName="sections.create" />}
        >
            <Card>
                <div className="flex flex-wrap gap-3 p-4">
                    <SearchInput
                        value={filters.search}
                        onChange={(value) => handleSearch(value)}
                        placeholder="Search by name…"
                    />
                    <select
                        value={filters.academic_session_id ?? ''}
                        onChange={(event) => updateFilter('academic_session_id', event.target.value)}
                        className="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                        <option value="">All sessions</option>
                        {Object.entries(sessions ?? {}).map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.school_class_id ?? ''}
                        onChange={(event) => updateFilter('school_class_id', event.target.value)}
                        className="rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    >
                        <option value="">All classes</option>
                        {Object.entries(classes ?? {}).map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
                <DataTable columns={columns} rows={sections} />
                <Pagination {...sections} />
            </Card>
        </AuthenticatedLayout>
    );
}
