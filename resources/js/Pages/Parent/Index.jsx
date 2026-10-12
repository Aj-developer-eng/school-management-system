import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import StatusBadge from '@/Components/Ui/StatusBadge';
import WhatsAppButton from '@/Components/Ui/WhatsAppButton';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { formatDate } from '@/utils/format';
import { Link } from '@inertiajs/react';
import { Eye, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Index({ parents, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('parents.index');

    // Hover-triggered children modal -----------------------------------------
    const [childrenParent, setChildrenParent] = useState(null);
    const hoverTimer = useRef(null);

    const cancelPendingHover = () => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
    };

    // Small hover-intent delay so a cursor sweeping across the table does not
    // flash the modal open accidentally.
    const openOnHover = (row) => {
        cancelPendingHover();
        hoverTimer.current = setTimeout(() => {
            hoverTimer.current = null;
            setChildrenParent(row);
        }, 300);
    };

    // Click/tap fallback so touch and keyboard users can open it too.
    const openOnClick = (row) => {
        cancelPendingHover();
        setChildrenParent(row);
    };

    const closeChildrenModal = () => {
        cancelPendingHover();
        setChildrenParent(null);
    };

    useEffect(() => cancelPendingHover, []);

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div>
                    <span>{row.user?.name}</span>
                    <small className="block text-xs text-gray-500 dark:text-gray-400">
                        {row.user?.email}
                    </small>
                </div>
            ),
        },
        {
            key: 'children',
            label: 'Children',
            render: (row) => (
                <button
                    type="button"
                    onMouseEnter={() => openOnHover(row)}
                    onMouseLeave={cancelPendingHover}
                    onClick={() => openOnClick(row)}
                    title="View children details"
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                >
                    <Users className="h-3.5 w-3.5" />
                    {row.students?.length ?? 0}
                </button>
            ),
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
                    <WhatsAppButton phone={row.user?.phone} name={row.user?.name} />
                    {can('parents.update') && <EditLink routeName="parents.edit" params={row.id} />}
                    {can('parents.delete') && <DeleteButton routeName="parents.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Parents"
            breadcrumbs={[{ label: 'Parents' }]}
            actions={can('parents.create') && <CreateButton routeName="parents.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name, email or CNIC…" />
                </div>
                <DataTable columns={columns} rows={parents} />
                <Pagination {...parents} />
            </Card>
            <ChildrenModal parent={childrenParent} onClose={closeChildrenModal} />
        </AuthenticatedLayout>
    );
}

// Hover modal showcasing a parent's linked students with reference details.
function ChildrenModal({ parent, onClose }) {
    const students = parent?.students ?? [];

    return (
        <Modal show={Boolean(parent)} onClose={onClose} maxWidth="2xl">
            <div>
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            <Users className="h-4 w-4" />
                            Children — {parent?.user?.name}
                        </h2>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {students.length} linked student{students.length === 1 ? '' : 's'}
                            {parent?.user?.email ? ` · ${parent.user.email}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        title="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-4">
                    {students.length > 0 ? (
                        <ul className="space-y-3">
                            {students.map((student) => (
                                <li
                                    key={student.id}
                                    className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
                                >
                                    <StudentDetails student={student} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                            No students linked to this parent yet.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// Reference details shown for one student inside the children modal.
function StudentDetails({ student }) {
    const enrollments = student.enrollments ?? [];
    const unique = (values) => [...new Set(values.filter(Boolean))];

    const sessionNames = unique(enrollments.map((e) => e.academic_session?.name)).join(', ');
    const classNames = unique(enrollments.map((e) => e.school_class?.name)).join(', ');
    const rollNumbers = unique(
        enrollments.map((e) => e.roll_number).filter((v) => v !== null && v !== undefined && v !== ''),
    ).join(', ');

    const details = [
        { label: 'Class', value: classNames || '—' },
        { label: 'Session', value: sessionNames || '—' },
        { label: 'Roll No', value: rollNumbers || '—' },
        { label: 'Gender', value: student.gender || '—', capitalize: true },
        { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
        { label: 'Phone', value: student.user?.phone || '—' },
    ];

    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {student.user?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Admission # {student.admission_number || '—'}
                    </p>
                </div>
                <StatusBadge active={student.is_active} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {student.pivot?.guardian_type || 'Guardian'}
                </span>
                {Boolean(student.pivot?.is_primary_contact) && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        Primary Contact
                    </span>
                )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {details.map((detail) => (
                    <div key={detail.label}>
                        <dt className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {detail.label}
                        </dt>
                        <dd
                            className={`mt-0.5 text-sm text-gray-900 dark:text-gray-100 ${detail.capitalize ? 'capitalize' : ''}`}
                        >
                            {detail.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-4 flex justify-end">
                <Link
                    href={route('students.show', student.id)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                    <Eye className="h-4 w-4" />
                    View full profile
                </Link>
            </div>
        </>
    );
}
