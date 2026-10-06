import { useMemo } from 'react';
import { Clock } from 'lucide-react';
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
import { formatTimeRange } from '@/utils/format';

export default function Index({ assignments, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('teacher-assignments.index');

    // Rows arrive sorted by class time (server-side); group them per time slot.
    const timeGroups = useMemo(() => {
        const groups = new Map();

        (assignments?.data ?? []).forEach((row) => {
            const key = `${row.start_time ?? ''}|${row.end_time ?? ''}`;

            if (!groups.has(key)) {
                const timeLabel = formatTimeRange(row.start_time, row.end_time);

                groups.set(key, {
                    key,
                    label: (
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {timeLabel === '—' ? 'No class time' : timeLabel}
                        </span>
                    ),
                    rows: [],
                });
            }

            groups.get(key).rows.push(row);
        });

        return [...groups.values()];
    }, [assignments]);

    const columns = [
        { key: 'teacher', label: 'Teacher', render: (row) => row.teacher?.user?.name },
        { key: 'academic_session', label: 'Session', render: (row) => row.academic_session?.name },
        { key: 'school_class', label: 'Class', render: (row) => row.school_class?.name },
        {
            key: 'class_time',
            label: 'Class Time',
            render: (row) => formatTimeRange(row.start_time, row.end_time),
        },
        {
            key: 'days_of_week',
            label: 'Days',
            render: (row) => {
                const labels = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };
                const days = row.days_of_week ?? [];
                return days.length > 0 ? days.map((d) => labels[d] ?? d).join(', ') : '—';
            },
        },
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
            title="Class Assignments"
            breadcrumbs={[{ label: 'Teacher Assignments' }]}
            actions={can('teacher-assignments.create') && <CreateButton routeName="teacher-assignments.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by teacher or class…" />
                </div>
                <DataTable columns={columns} rows={assignments} groups={timeGroups} />
                <Pagination {...assignments} />
            </Card>
        </AuthenticatedLayout>
    );
}
