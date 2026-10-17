import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
import { Link } from '@inertiajs/react';
import { Eye, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 340; // Estimated height, used to decide flipping above the trigger.
const CLOSE_DELAY = 160; // Grace period so the pointer can travel into the panel.

export default function Index({ parents, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('parents.index');
    const [hoveredChildren, setHoveredChildren] = useState(null); // { parent, rect }
    const closeTimer = useRef(null);

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(() => setHoveredChildren(null), CLOSE_DELAY);
    };

    const openChildren = (row, trigger) => {
        cancelClose();
        setHoveredChildren({ parent: row, rect: trigger.getBoundingClientRect() });
    };

    // Close the panel on Escape, page scroll and viewport resize while it is open.
    useEffect(() => {
        if (!hoveredChildren) return undefined;

        const close = () => setHoveredChildren(null);
        const onKeyDown = (event) => {
            if (event.key === 'Escape') close();
        };

        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [hoveredChildren]);

    // Clear any pending close timer on unmount.
    useEffect(() => () => cancelClose(), []);

    const columns = [
        { key: 'name', label: 'Name', render: (row) => row.user?.name },
        { key: 'email', label: 'Email', render: (row) => row.user?.email }, 
        {
            key: 'children',
            label: 'Children',
            render: (row) => (
                <button
                    type="button"
                    onMouseEnter={(event) => openChildren(row, event.currentTarget)}
                    onMouseLeave={scheduleClose}
                    onFocus={(event) => openChildren(row, event.currentTarget)}
                    onBlur={scheduleClose}
                    onClick={(event) => {
                        // Toggle on click so touch devices can use it too.
                        if (hoveredChildren?.parent.id === row.id) {
                            setHoveredChildren(null);
                        } else {
                            openChildren(row, event.currentTarget);
                        }
                    }}
                    title="View children"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
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

            {hoveredChildren && (
                <ChildrenHoverModal
                    parent={hoveredChildren.parent}
                    rect={hoveredChildren.rect}
                    canViewDetail={can('students.view')}
                    onKeepOpen={cancelClose}
                    onClose={scheduleClose}
                    onDismiss={() => setHoveredChildren(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function ChildrenHoverModal({ parent, rect, canViewDetail, onKeepOpen, onClose, onDismiss }) {
    const students = parent.students ?? [];

    // Anchor the panel to the trigger, flipping above it when there is not enough room below.
    const left = Math.min(Math.max(rect.left, 8), window.innerWidth - PANEL_WIDTH - 8);
    const style = { left, width: PANEL_WIDTH };
    if (rect.bottom + PANEL_HEIGHT > window.innerHeight) {
        style.bottom = window.innerHeight - rect.top + 8;
    } else {
        style.top = rect.bottom + 8;
    }

    // Portal to body so the table's overflow container cannot clip the panel.
    return createPortal(
        <div
            role="dialog"
            aria-label={`Children of ${parent.user?.name ?? 'parent'}`}
            style={style}
            onMouseEnter={onKeepOpen}
            onMouseLeave={onClose}
            className="fixed z-50 animate-rise overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Children — {parent.user?.name}
                    </h2>
                    <p className="text-xs text-gray-400">
                        {students.length} {students.length === 1 ? 'student' : 'students'} linked
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Close"
                    className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
                {students.length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {students.map((student) => {
                            const enrollment = student.enrollments?.[0];

                            return (
                                <li key={student.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
                                            {student.user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {student.user?.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-400">
                                                {student.admission_number ?? 'No admission #'}
                                                {' · '}
                                                {enrollment?.school_class?.name ?? 'Not enrolled'}
                                                {enrollment?.section?.name ? ` — ${enrollment.section.name}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {canViewDetail && (
                                        <Link
                                            href={route('students.show', student.id)}
                                            onClick={onDismiss}
                                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View Details
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No children linked to this parent.
                    </p>
                )}
            </div>
        </div>,
        document.body,
    );
}
