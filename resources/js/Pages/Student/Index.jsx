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
import { confirmAction } from '@/utils/swal';
import { Link, router } from '@inertiajs/react';
import { CheckCircle2, Download, Eye, GraduationCap, Power, UserCheck, XCircle } from 'lucide-react';

export default function Index({ students, stats, filters }) {
    const { can, isSuperAdmin } = useAuth();
    const handleSearch = useFilter('students.index');

    const toggleActive = async (row) => {
        const action = row.is_active ? 'deactivate' : 'activate';
        const confirmed = await confirmAction({
            title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Student`,
            text: `Are you sure you want to ${action} "${row.user?.name}"?`,
            confirmButtonText: `Yes, ${action}`,
            confirmColor: action === 'deactivate' ? '#d97706' : '#059669',
        });

        if (confirmed) {
            router.patch(route('students.toggle-active', row.id), {}, { preserveScroll: true });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{row.user?.name}</span>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {row.admission_number}
                        </span>
                    </div>
                    <span className="mt-1 block w-fit rounded-md bg-gray-50 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                        {row.user?.email || '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'current_class',
            label: 'Current Class',
            render: (row) => {
                const e = row.enrollments?.[0];
                return e
                    ? `${[e.school_class?.name, e.section?.name].filter(Boolean).join(' ')} (${e.academic_session?.name})`
                    : '—';
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
            width: '200px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Link
                        href={route('students.show', row.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                        title="View"
                    >
                        <Eye className="h-4 w-4" />
                    </Link>
                    {can('students.update') && <EditLink routeName="students.edit" params={row.id} />}
                    {isSuperAdmin && (
                        <a
                            href={route('students.pdf', row.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                            title="Download Full Record (PDF)"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    )}
                    {can('students.update') && !isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => toggleActive(row)}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                                row.is_active
                                    ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                            }`}
                            title={row.is_active ? 'Deactivate' : 'Activate'}
                        >
                            <Power className="h-4 w-4" />
                        </button>
                    )}
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
            <div className="space-y-6">
                {/* Overview tiles */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard icon={GraduationCap} label="Total Students" value={stats?.total ?? 0} color="indigo" />
                    <StatCard icon={CheckCircle2} label="Active Students" value={stats?.active ?? 0} color="emerald" />
                    <StatCard icon={XCircle} label="Inactive Students" value={stats?.inactive ?? 0} color="amber" />
                    <StatCard icon={UserCheck} label="Enrolled This Session" value={stats?.enrolled ?? 0} color="sky" />
                </div>

                <Card>
                    <div className="p-4">
                        <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name, email or admission #…" />
                    </div>
                    <DataTable columns={columns} rows={students} compact />
                    <Pagination {...students} />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    };
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${colors[color] ?? colors.indigo}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}
