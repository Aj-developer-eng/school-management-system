import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import StatusBadge from '@/Components/Ui/StatusBadge';
import { normalizePhone } from '@/Components/Ui/WhatsAppButton';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { confirmAction } from '@/utils/swal';
import { Link, router } from '@inertiajs/react';
import { Download, Eye, Power } from 'lucide-react';

export default function Index({ students, filters }) {
    const { can, isSuperAdmin } = useAuth();
    const handleSearch = useFilter('students.index');
    const hasRows = Boolean(students?.data?.length);

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

    // Contact cell shared by the desktop table and the mobile card list.
    const renderContact = (row) => {
        const phone = row.user?.phone;
        const whatsappNumber = normalizePhone(phone);

        return (
            <div>
                <span>{row.user?.email}</span>
                <small className="block text-xs text-gray-500 dark:text-gray-400">
                    {phone ? (
                        whatsappNumber ? (
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="hover:text-green-600 hover:underline dark:hover:text-green-400"
                            >
                                {phone}
                            </a>
                        ) : (
                            phone
                        )
                    ) : (
                        '—'
                    )}
                </small>
            </div>
        );
    };

    // Unique category sessions this student is enrolled in, joined the same
    // way StudentController::show() presents them ("2025-2026, 2026-2027").
    // Multi-class enrollments within one session collapse to a single name.
    const sessionNames = (row) =>
        [
            ...new Set(
                (row.enrollments ?? [])
                    .map((enrollment) => enrollment.academic_session?.name)
                    .filter(Boolean),
            ),
        ].join(', ');

    // Desktop (md and up) table cells / actions.
    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div>
                    <span>{row.user?.name}</span>
                    <small className="block text-xs text-gray-500 dark:text-gray-400">
                        {row.admission_number}
                    </small>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Contact',
            render: renderContact,
        },
        {
            key: 'session',
            label: 'Category Session',
            render: (row) => <span>{sessionNames(row) || '—'}</span>,
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

    // Touch-friendly icon button (40x40) used by the mobile card list below.
    const iconAction =
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-700';

    // Phone / small tablet (< md): the table gets too cramped, so each student
    // is rendered as a stacked card instead — same data, same actions.
    const mobileCard = (row, index) => {
        const phone = row.user?.phone;
        const whatsappNumber = normalizePhone(phone);

        return (
            <li key={row.id ?? index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {row.user?.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {row.admission_number}
                        </p>
                    </div>
                    <StatusBadge active={row.is_active} />
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p className="break-all">{row.user?.email ?? '—'}</p>
                    <p className="break-all">
                        {phone ? (
                            whatsappNumber ? (
                                <a
                                    href={`https://wa.me/${whatsappNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Chat on WhatsApp"
                                    className="hover:text-green-600 hover:underline dark:hover:text-green-400"
                                >
                                    {phone}
                                </a>
                            ) : (
                                phone
                            )
                        ) : (
                            '—'
                        )}
                    </p>
                </div>

                <div className="mt-3 border-t border-dashed border-gray-200 pt-3 dark:border-gray-600">
                    <span className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Category Session
                    </span>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                        {sessionNames(row) || '—'}
                    </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                        href={route('students.show', row.id)}
                        className={`${iconAction} text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10`}
                        title="View"
                        aria-label="View"
                    >
                        <Eye className="h-4 w-4" />
                    </Link>
                    {can('students.update') && (
                        <EditLink
                            routeName="students.edit"
                            params={row.id}
                            className={`${iconAction} hover:bg-indigo-50 dark:hover:bg-indigo-500/10`}
                        />
                    )}
                    {isSuperAdmin && (
                        <a
                            href={route('students.pdf', row.id)}
                            className={`${iconAction} text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10`}
                            title="Download Full Record (PDF)"
                            aria-label="Download Full Record (PDF)"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    )}
                    {can('students.update') && !isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => toggleActive(row)}
                            className={`${iconAction} ${
                                row.is_active
                                    ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                            }`}
                            title={row.is_active ? 'Deactivate' : 'Activate'}
                            aria-label={row.is_active ? 'Deactivate' : 'Activate'}
                        >
                            <Power className="h-4 w-4" />
                        </button>
                    )}
                    {can('students.delete') && (
                        <DeleteButton
                            routeName="students.destroy"
                            params={row.id}
                            className={`${iconAction} hover:bg-red-50 dark:hover:bg-red-500/10`}
                        />
                    )}
                </div>
            </li>
        );
    };

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

                {!hasRows ? (
                    <DataTable columns={columns} rows={students} />
                ) : (
                    <>
                        {/* Phones & small tablets: stacked cards instead of a cramped table */}
                        <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700 md:hidden">
                            {students.data.map((row, index) => mobileCard(row, index))}
                        </ul>

                        {/* Tablets & desktop: the table */}
                        <div className="hidden md:block">
                            <DataTable columns={columns} rows={students} />
                        </div>
                    </>
                )}

                <Pagination {...students} />
            </Card>
        </AuthenticatedLayout>
    );
}
