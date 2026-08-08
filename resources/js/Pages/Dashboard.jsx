import DashboardCard from '@/Components/Dashboard/DashboardCard';
import QuickAction from '@/Components/Dashboard/QuickAction';
import SimpleBarChart from '@/Components/Dashboard/SimpleBarChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useAuth } from '@/utils/authorization';
import { Link, router } from '@inertiajs/react';

const statusColors = {
    unpaid: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    started: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

function formatRs(value) {
    return `Rs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StaffDashboard({ stats, quickActions, enrollmentsByClass, assignmentOverview, assignmentStats }) {
    return (
        <>
            {quickActions.length > 0 && (
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                        {quickActions.map((action) => (
                            <QuickAction
                                key={action.label}
                                label={action.label}
                                routeName={action.route}
                                icon={action.icon}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    School Overview
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DashboardCard title="Students" value={stats.students} subtitle="Active enrolled" color="indigo" />
                    <DashboardCard title="Teachers" value={stats.teachers} subtitle="Teaching staff" color="emerald" />
                    <DashboardCard title="Parents" value={stats.parents} subtitle="Registered guardians" color="amber" />
                    <DashboardCard title="Classes" value={stats.classes} subtitle="Active classes" color="sky" />
                    <DashboardCard title="Sections" value={stats.sections} subtitle="Active sections" color="violet" />
                    <DashboardCard title="Subjects" value={stats.subjects} subtitle="In catalog" color="rose" />
                </div>
            </div>

            <SimpleBarChart
                data={enrollmentsByClass}
                title="Student Enrollments by Class (Active Session)"
                emptyMessage="No enrollments found for the active session."
            />

            {/* Teacher assignment overview */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Teacher Assignment Overview
                    </h3>
                    <Link
                        href={route('teacher-reports.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        View Full Report
                    </Link>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <DashboardCard title="Total" value={assignmentStats.total} subtitle="All assignments" color="indigo" />
                    <DashboardCard title="Pending" value={assignmentStats.pending} subtitle="Not started" color="amber" />
                    <DashboardCard title="Started" value={assignmentStats.started} subtitle="In progress" color="sky" />
                    <DashboardCard title="Completed" value={assignmentStats.completed} subtitle="Finished" color="emerald" />
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Section</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignmentOverview.length > 0 ? assignmentOverview.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {a.teacher?.user?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.school_class?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.section?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.subject?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? statusColors.pending}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No teacher assignments for this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function ParentDashboard({ children, invoices, feeSummary, activeSession }) {
    return (
        <>
            {/* Quick action */}
            <div className="flex items-center justify-end">
                <Link
                    href={route('special-requests.create')}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                    New Special Request
                </Link>
            </div>

            {/* Fee summary cards */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fee Summary
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Total Invoiced" value={formatRs(feeSummary.total_invoiced)} subtitle="All children" color="indigo" />
                    <DashboardCard title="Total Paid" value={formatRs(feeSummary.total_paid)} subtitle="Payments received" color="emerald" />
                    <DashboardCard title="Outstanding" value={formatRs(feeSummary.total_outstanding)} subtitle="Amount due" color="rose" />
                    <DashboardCard title="Pending Invoices" value={feeSummary.unpaid_count} subtitle="Unpaid / partial" color="amber" />
                </div>
            </div>

            {/* Children progress */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    My Children
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {children.length > 0 ? children.map((child) => {
                        const enrollment = child.enrollments?.[0];
                        return (
                            <div key={child.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                        {child.user?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{child.user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Admission #: {child.admission_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Class</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {enrollment?.school_class?.name ?? 'Not enrolled'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Section</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {enrollment?.section?.name ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Session</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {enrollment?.academic_session?.name ?? activeSession ?? '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">
                            No children linked to your account.
                        </p>
                    )}
                </div>
            </div>

            {/* Recent invoices */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Recent Invoices
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Child</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Fee</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Balance</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                    <td className="px-4 py-3">
                                        <Link href={route('fee-invoices.show', inv.id)} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                                            {inv.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.student?.user?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.fee_structure?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function StudentDashboard({ enrollment, invoices, activeSession, student }) {
    return (
        <>
            {/* Enrollment info */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    My Enrollment
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Admission #" value={student?.admission_number ?? '—'} subtitle="Your ID" color="indigo" />
                    <DashboardCard title="Class" value={enrollment?.school_class?.name ?? '—'} subtitle="Current class" color="emerald" />
                    <DashboardCard title="Section" value={enrollment?.section?.name ?? '—'} subtitle="Assigned section" color="amber" />
                    <DashboardCard title="Session" value={enrollment?.academic_session?.name ?? activeSession ?? '—'} subtitle="Active session" color="sky" />
                </div>
            </div>

            {/* Recent invoices */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    My Recent Invoices
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Invoice #</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Fee</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Balance</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                    <td className="px-4 py-3">
                                        <Link href={route('fee-invoices.show', inv.id)} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                                            {inv.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.fee_structure?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function TeacherDashboard({ assignments, assignmentStats, activeSession, teacher }) {
    return (
        <>
            {/* Quick action */}
            <div className="flex items-center justify-end">
                <Link
                    href={route('attendance.index')}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                    Record Attendance
                </Link>
            </div>

            {/* Assignment stats */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    My Assignments
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Total" value={assignmentStats.total_assignments} subtitle="Assigned classes" color="indigo" />
                    <DashboardCard title="Pending" value={assignmentStats.pending} subtitle="Not started yet" color="amber" />
                    <DashboardCard title="Started" value={assignmentStats.started} subtitle="In progress" color="sky" />
                    <DashboardCard title="Completed" value={assignmentStats.completed} subtitle="Finished" color="emerald" />
                </div>
            </div>

            {/* Assignments table */}
            <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Class Assignments
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Section</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length > 0 ? assignments.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {a.school_class?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.section?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.subject?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? statusColors.pending}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {a.status === 'pending' && (
                                            <button
                                                onClick={() => router.patch(route('dashboard.assignments.start', a.id))}
                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                            >
                                                Mark Started
                                            </button>
                                        )}
                                        {a.status === 'started' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.patch(route('dashboard.assignments.complete', a.id))}
                                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                                >
                                                    Mark Completed
                                                </button>
                                                <button
                                                    onClick={() => router.patch(route('dashboard.assignments.reset', a.id))}
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                        {a.status === 'completed' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-400">Done</span>
                                                <button
                                                    onClick={() => router.patch(route('dashboard.assignments.reset', a.id))}
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                        No class assignments for this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default function Dashboard(props) {
    const { user, roles } = useAuth();
    const {
        dashboardType,
        stats,
        quickActions,
        enrollmentsByClass,
        children,
        invoices,
        feeSummary,
        activeSession,
        enrollment,
        student,
        assignments,
        assignmentStats,
        teacher,
    } = props;

    const sessionLabel = dashboardType === 'staff'
        ? stats?.active_session
        : activeSession;

    return (
        <AuthenticatedLayout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
            <div className="space-y-6">
                {/* Welcome */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Welcome back, {user?.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        You are signed in as {roles.join(', ') || 'a user'}.
                        {sessionLabel && (
                            <> Active academic session: <span className="font-medium text-gray-700 dark:text-gray-300">{sessionLabel}</span></>
                        )}
                    </p>
                </div>

                {dashboardType === 'parent' && (
                    <ParentDashboard
                        children={children ?? []}
                        invoices={invoices ?? []}
                        feeSummary={feeSummary}
                        activeSession={activeSession}
                    />
                )}

                {dashboardType === 'student' && (
                    <StudentDashboard
                        enrollment={enrollment}
                        invoices={invoices ?? []}
                        activeSession={activeSession}
                        student={student}
                    />
                )}

                {dashboardType === 'teacher' && (
                    <TeacherDashboard
                        assignments={assignments ?? []}
                        assignmentStats={assignmentStats}
                        activeSession={activeSession}
                        teacher={teacher}
                    />
                )}

                {dashboardType !== 'parent' && dashboardType !== 'student' && dashboardType !== 'teacher' && (
                    <StaffDashboard
                        stats={stats}
                        quickActions={quickActions ?? []}
                        enrollmentsByClass={enrollmentsByClass}
                        assignmentOverview={props.assignmentOverview ?? []}
                        assignmentStats={props.assignmentStats ?? { total: 0, pending: 0, started: 0, completed: 0 }}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
