import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import { useAuth } from '@/utils/authorization';
import { formatDateTime } from '@/utils/format';
import { router, Link } from '@inertiajs/react';
import { Power, PowerOff, ClipboardCheck } from 'lucide-react';

const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    disabled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function Index({ onlineClasses, filters, canMarkAttendance }) {
    const { can } = useAuth();

    const columns = [
        {
            key: 'title',
            label: 'Title',
            render: (row) => row.title || '—',
        },
        {
            key: 'class',
            label: 'Class',
            render: (row) => (
                <span>
                    {row.school_class?.name ?? '—'}
                    {row.section ? ` — ${row.section.name}` : ''}
                </span>
            ),
        },
        {
            key: 'subject',
            label: 'Subject',
            render: (row) => row.subject?.name ?? '—',
        },
        {
            key: 'teacher',
            label: 'Teacher',
            render: (row) => row.teacher?.user?.name ?? '—',
        },
        {
            key: 'scheduled_at',
            label: 'Scheduled',
            render: (row) => formatDateTime(row.scheduled_at),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                const status = row.status?.value ?? row.status;
                return (
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] ?? statusColors.active}`}>
                        {row.status?.label ?? status}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '180px',
            render: (row) => {
                const status = row.status?.value ?? row.status;
                return (
                    <div className="flex items-center gap-3">
                        {canMarkAttendance && (
                            <Link
                                href={route('online-classes.attendance', row.id)}
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                title="Mark Attendance"
                            >
                                <ClipboardCheck size={16} />
                            </Link>
                        )}
                        {can('online-classes.update') && (
                            <button
                                type="button"
                                onClick={() => router.patch(route('online-classes.toggle', row.id), {}, { preserveScroll: true })}
                                className={`inline-flex items-center gap-1 ${status === 'active' ? 'text-amber-600 hover:text-amber-800 dark:text-amber-400' : 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400'}`}
                                title={status === 'active' ? 'Disable' : 'Re-enable'}
                            >
                                {status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                        )}
                        {can('online-classes.update') && <EditLink routeName="online-classes.edit" params={row.id} />}
                        {can('online-classes.delete') && <DeleteButton routeName="online-classes.destroy" params={row.id} confirmMessage="Delete this online class link?" />}
                    </div>
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout
            title="Online Classes"
            breadcrumbs={[{ label: 'Academics' }, { label: 'Online Classes' }]}
            actions={can('online-classes.create') && <CreateButton routeName="online-classes.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput
                        value={filters.search}
                        onChange={(e) => router.visit(route('online-classes.index', { search: e.target.value }), { preserveScroll: true, preserveState: true })}
                        placeholder="Search by title, class, or teacher…"
                    />
                </div>
                <DataTable columns={columns} rows={onlineClasses} emptyMessage="No online classes yet." />
                <Pagination {...onlineClasses} />
            </Card>
        </AuthenticatedLayout>
    );
}
