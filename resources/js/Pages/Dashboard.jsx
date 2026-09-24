import DashboardCard from '@/Components/Dashboard/DashboardCard';
import EnrollmentBarChart from '@/Components/Dashboard/EnrollmentBarChart';
import QuickAction from '@/Components/Dashboard/QuickAction';
import StatusDonutChart from '@/Components/Dashboard/StatusDonutChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useAuth } from '@/utils/authorization';
import { formatDate, formatTimeRange } from '@/utils/format';
import { Download, GraduationCap, Sparkles } from 'lucide-react';
import { Link, router } from '@inertiajs/react';

const statusColors = {
    unpaid: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    started: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    absent: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    late: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    excused: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
};

function formatRs(value) {
    return `Rs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function SectionHeading({ children, action }) {
    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <span className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {children}
                </h3>
            </div>
            {action}
        </div>
    );
}

const invoiceSegments = [
    { key: 'paid', label: 'Paid', ring: 'stroke-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
    { key: 'partial', label: 'Partial', ring: 'stroke-amber-500', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300' },
    { key: 'unpaid', label: 'Unpaid', ring: 'stroke-rose-500', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-300' },
    { key: 'cancelled', label: 'Cancelled', ring: 'stroke-gray-400', dot: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' },
];

const WEEK_DAYS = [
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
    { value: 7, label: 'Sunday', short: 'Sun' },
];

const formatTime12 = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

function StaffDashboard({ stats, quickActions, enrollmentsByClass, assignmentOverview, assignmentStats, invoiceStats, invoiceReferences, timetable }) {
    return (
        <>
            {quickActions.length > 0 && (
                <div className="animate-fade-in">
                    <SectionHeading>Quick Actions</SectionHeading>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                        {quickActions.map((action, index) => (
                            <QuickAction
                                key={action.label}
                                label={action.label}
                                routeName={action.route}
                                icon={action.icon}
                                delay={index * 60}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="animate-fade-in">
                <SectionHeading>School Overview</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DashboardCard title="Students" value={stats.students} subtitle="Active enrolled" color="indigo" delay={0} />
                    <DashboardCard title="Teachers" value={stats.teachers} subtitle="Teaching staff" color="emerald" delay={70} />
                    <DashboardCard title="Parents" value={stats.parents} subtitle="Registered guardians" color="amber" delay={140} />
                    <DashboardCard title="Classes" value={stats.classes} subtitle="Active classes" color="sky" delay={210} />
                    <DashboardCard title="Sections" value={stats.sections} subtitle="Active sections" color="violet" delay={280} />
                    <DashboardCard title="Subjects" value={stats.subjects} subtitle="In catalog" color="rose" delay={350} />
                </div>
            </div>

            <EnrollmentBarChart
                data={enrollmentsByClass}
                title="Student Enrollments by Class (Active Session)"
                emptyMessage="No enrollments found for the active session."
            />

            {/* Fee invoice status overview */}
            <div className="animate-fade-in">
                <SectionHeading
                    action={
                        <Link
                            href={route('fee-invoices.index')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                        >
                            View All Invoices
                        </Link>
                    }
                >
                    Fee Invoices Overview
                </SectionHeading>
                <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <StatusDonutChart
                            stats={invoiceStats}
                            title="Invoice Status"
                            segments={invoiceSegments}
                        />
                    </div>
                    <div className="grid grid-cols-2 content-center gap-4 lg:col-span-3">
                        <DashboardCard title="Paid" value={invoiceStats.paid} subtitle="Fully settled" color="emerald" delay={0} />
                        <DashboardCard title="Partial" value={invoiceStats.partial} subtitle="Partly paid" color="amber" delay={70} />
                        <DashboardCard title="Unpaid" value={invoiceStats.unpaid} subtitle="Outstanding" color="rose" delay={140} />
                        <DashboardCard title="Cancelled" value={invoiceStats.cancelled} subtitle="Voided" color="violet" delay={210} />
                    </div>
                </div>

                {/* Invoice references */}
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Reference</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fee</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Balance</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {invoiceReferences.length > 0 ? invoiceReferences.map((inv) => (
                                <tr key={inv.id} className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <Link href={route('fee-invoices.show', inv.id)} className="font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                                            {inv.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.student?.user?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.fee_structure?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Teacher assignment overview */}
            <div className="animate-fade-in">
                <SectionHeading
                    action={
                        <Link
                            href={route('teacher-reports.index')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                        >
                            View Full Report
                        </Link>
                    }
                >
                    Teacher Assignment Overview
                </SectionHeading>
                <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <StatusDonutChart stats={assignmentStats} title="Assignment Status" />
                    </div>
                    <div className="grid grid-cols-2 content-center gap-4 lg:col-span-3">
                        <DashboardCard title="Total" value={assignmentStats.total} subtitle="All assignments" color="indigo" delay={0} />
                        <DashboardCard title="Pending" value={assignmentStats.pending} subtitle="Not started" color="amber" delay={70} />
                        <DashboardCard title="Started" value={assignmentStats.started} subtitle="In progress" color="sky" delay={140} />
                        <DashboardCard title="Completed" value={assignmentStats.completed} subtitle="Finished" color="emerald" delay={210} />
                    </div>
                </div>
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Teacher</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignmentOverview.length > 0 ? assignmentOverview.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-gray-700/50 dark:hover:bg-gray-700/30">
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
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {formatTimeRange(a.start_time, a.end_time)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[a.status] ?? statusColors.pending}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No teacher assignments for this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly timetable */}
            <TimetableSection timetable={timetable} />
        </>
    );
}

function TimetableSection({ timetable }) {
    const byDay = {};
    (timetable ?? []).forEach((entry) => {
        (byDay[entry.day] ??= []).push(entry);
    });
    const days = WEEK_DAYS.filter((d) => byDay[d.value]?.length);

    if (days.length === 0) {
        return null;
    }

    return (
        <div className="animate-fade-in">
            <SectionHeading>Weekly Timetable</SectionHeading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {days.map((day, dayIndex) => (
                    <div
                        key={day.value}
                        className="animate-rise overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800"
                        style={{ animationDelay: `${dayIndex * 60}ms` }}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-700/60 dark:bg-gray-700/40">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{day.label}</span>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                {byDay[day.value].length} class{byDay[day.value].length !== 1 ? 'es' : ''}
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                            {byDay[day.value].map((entry) => (
                                <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-16 shrink-0 rounded-md bg-gray-50 px-1.5 py-1 text-center dark:bg-gray-700/50">
                                        <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                                            {formatTime12(entry.start_time)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                            {formatTime12(entry.end_time)}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {entry.subject?.name ?? entry.subject ?? '—'}
                                        </p>
                                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                            {entry.school_class?.name ?? entry.class ?? '—'}
                                            {entry.section?.name ?? entry.section ? ` · ${entry.section?.name ?? entry.section}` : ''}
                                            {' · '}
                                            {entry.teacher?.user?.name ?? entry.teacher ?? '—'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ParentDashboard({ children, invoices, feeSummary, activeSession, todayAttendance, subjectPapers, timetable }) {
    const { can } = useAuth();

    return (
        <>
            {/* Quick action */}
            <div className="animate-fade-in flex items-center justify-end">
                <Link
                    href={route('special-requests.create')}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40"
                >
                    New Special Request
                </Link>
            </div>

            {/* Fee summary cards */}
            <div className="animate-fade-in">
                <SectionHeading>Fee Summary</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Total Invoiced" value={formatRs(feeSummary.total_invoiced)} subtitle="All children" color="indigo" delay={0} />
                    <DashboardCard title="Total Paid" value={formatRs(feeSummary.total_paid)} subtitle="Payments received" color="emerald" delay={70} />
                    <DashboardCard title="Outstanding" value={formatRs(feeSummary.total_outstanding)} subtitle="Amount due" color="rose" delay={140} />
                    <DashboardCard title="Pending Invoices" value={feeSummary.unpaid_count} subtitle="Unpaid / partial" color="amber" delay={210} />
                </div>
            </div>

            {/* Today's attendance */}
            {can('attendances.view') && (
            <div className="animate-fade-in">
                <SectionHeading
                    action={
                        <Link
                            href={route('attendance.report')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300"
                        >
                            View Full Report
                        </Link>
                    }
                >
                    Today&apos;s Attendance
                </SectionHeading>
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Child</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Teacher</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayAttendance.length > 0 ? todayAttendance.map((r) => (
                                <tr key={r.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-gray-700/50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {r.student?.user?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {r.school_class?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {r.subject?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {r.assignment?.teacher?.user?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[r.status] ?? statusColors.present}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {r.remarks ?? '—'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No attendance recorded for today ({formatDate(new Date())}).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            <PapersSection papers={subjectPapers ?? []} />

            {/* Children progress */}
            <div className="animate-fade-in">
                <SectionHeading>My Children</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {children.length > 0 ? children.map((child, index) => {
                        const enrollment = child.enrollments?.[0];
                        return (
                            <div
                                key={child.id}
                                className="group animate-rise rounded-xl border border-gray-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
                                        {child.user?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{child.user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Admission #: {child.admission_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-3 text-sm dark:border-gray-700/60">
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
                                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                            Active
                                        </span>
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
            <div className="animate-fade-in">
                <SectionHeading>Recent Invoices</SectionHeading>
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Child</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fee</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Balance</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">PDF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-gray-700/50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <Link href={route('fee-invoices.show', inv.id)} className="font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                                            {inv.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.student?.user?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.fee_structure?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <a
                                            href={route('fee-invoices.pdf', inv.id)}
                                            title="Download invoice PDF"
                                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                        >
                                            <Download size={14} />
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TimetableSection timetable={timetable} />
        </>
    );
}

function PapersSection({ papers }) {
    const { can } = useAuth();

    if (!can('subjects.download-papers') && !can('subjects.upload-papers')) {
        return null;
    }

    return (
        <div className="animate-fade-in">
            <SectionHeading>Past Papers</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {papers.length > 0 ? papers.map((subject, index) => (
                    <div
                        key={subject.id}
                        className="animate-rise rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-800"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{subject.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{subject.code}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                {subject.papers.length}
                            </span>
                        </div>
                        <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700/60">
                            {subject.papers.map((paper) => (
                                <li key={paper.id} className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-gray-700 dark:text-gray-300">{paper.title}</p>
                                        <p className="truncate text-xs text-gray-400">{paper.original_name}</p>
                                    </div>
                                    <a
                                        href={route('subject-papers.download', paper.id)}
                                        title={`Download ${paper.title}`}
                                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                    >
                                        <Download size={14} />
                                        PDF
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )) : (
                    <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">
                        No past papers have been uploaded yet for your children&apos;s subjects.
                    </p>
                )}
            </div>
        </div>
    );
}

function StudentDashboard({ enrollment, invoices, activeSession, student, timetable }) {
    return (
        <>
            {/* Enrollment info */}
            <div className="animate-fade-in">
                <SectionHeading>My Enrollment</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Admission #" value={student?.admission_number ?? '—'} subtitle="Your ID" color="indigo" delay={0} />
                    <DashboardCard title="Class" value={enrollment?.school_class?.name ?? '—'} subtitle="Current class" color="emerald" delay={70} />
                    <DashboardCard title="Section" value={enrollment?.section?.name ?? '—'} subtitle="Assigned section" color="amber" delay={140} />
                    <DashboardCard title="Session" value={enrollment?.academic_session?.name ?? activeSession ?? '—'} subtitle="Active session" color="sky" delay={210} />
                </div>
            </div>

            {/* Recent invoices */}
            <div className="animate-fade-in">
                <SectionHeading>My Recent Invoices</SectionHeading>
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fee</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Balance</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">PDF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-gray-700/50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3">
                                        <Link href={route('fee-invoices.show', inv.id)} className="font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                                            {inv.invoice_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.fee_structure?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatRs(inv.total_amount)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">{formatRs(inv.balance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[inv.status] ?? statusColors.unpaid}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <a
                                            href={route('fee-invoices.pdf', inv.id)}
                                            title="Download invoice PDF"
                                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                        >
                                            <Download size={14} />
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No invoices found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TimetableSection timetable={timetable} />
        </>
    );
}

function TeacherDashboard({ assignments, assignmentStats, activeSession, teacher, timetable }) {
    const { can } = useAuth();

    return (
        <>
            {/* Quick action */}
            {can('attendances.view') && (
                <div className="animate-fade-in flex items-center justify-end">
                    <Link
                        href={route('attendance.index')}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40"
                    >
                        Record Attendance
                    </Link>
                </div>
            )}

            {/* Assignment stats */}
            <div className="animate-fade-in">
                <SectionHeading>My Assignments</SectionHeading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard title="Total" value={assignmentStats.total_assignments} subtitle="Assigned classes" color="indigo" delay={0} />
                    <DashboardCard title="Pending" value={assignmentStats.pending} subtitle="Not started yet" color="amber" delay={70} />
                    <DashboardCard title="Started" value={assignmentStats.started} subtitle="In progress" color="sky" delay={140} />
                    <DashboardCard title="Completed" value={assignmentStats.completed} subtitle="Finished" color="emerald" delay={210} />
                </div>
            </div>

            {/* Assignments table */}
            <div className="animate-fade-in">
                <SectionHeading>Class Assignments</SectionHeading>
                <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-700/40">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length > 0 ? assignments.map((a) => (
                                <tr key={a.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-gray-700/50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {a.school_class?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.section?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {a.subject?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                        {formatTimeRange(a.start_time, a.end_time)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[a.status] ?? statusColors.pending}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {a.status === 'pending' && (
                                            <button
                                                onClick={() => router.patch(route('dashboard.assignments.start', a.id))}
                                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/30"
                                            >
                                                Mark Started
                                            </button>
                                        )}
                                        {a.status === 'started' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.patch(route('dashboard.assignments.complete', a.id))}
                                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/30"
                                                >
                                                    Mark Completed
                                                </button>
                                                <button
                                                    onClick={() => router.patch(route('dashboard.assignments.reset', a.id))}
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No class assignments for this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TimetableSection timetable={timetable} />
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
        todayAttendance,
    } = props;

    const sessionLabel = dashboardType === 'staff'
        ? stats?.active_session
        : activeSession;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <AuthenticatedLayout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
            <div className="space-y-6">
                {/* Welcome banner */}
                <div className="animate-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-indigo-950 to-navy p-6 shadow-hero sm:p-8">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
                    <div className="pointer-events-none absolute -bottom-28 -left-12 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12]"
                        style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                        aria-hidden="true"
                    />
                    <GraduationCap
                        className="pointer-events-none absolute -bottom-5 right-4 h-32 w-32 text-white/[0.05]"
                        strokeWidth={1.25}
                        aria-hidden="true"
                    />
                    <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold via-amber-400/70 to-transparent" aria-hidden="true" />

                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span
                                className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm"
                                style={{ animationDelay: '150ms' }}
                            >
                                <Sparkles size={12} aria-hidden="true" />
                                {greeting}
                            </span>
                            <h2
                                className="animate-fade-in mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl"
                                style={{ animationDelay: '250ms' }}
                            >
                                Welcome back,{' '}
                                <span className="bg-gradient-to-r from-amber-200 via-gold to-amber-200 bg-clip-text text-transparent">
                                    {user?.name}
                                </span>
                            </h2>
                            <p className="animate-fade-in mt-2 text-sm text-indigo-200/80" style={{ animationDelay: '350ms' }}>
                                You are signed in as {roles.join(', ') || 'a user'}.
                            </p>
                        </div>

                        {sessionLabel && (
                            <div
                                className="animate-fade-in inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-indigo-100 backdrop-blur-sm lg:self-auto"
                                style={{ animationDelay: '450ms' }}
                            >
                                <span className="relative flex h-2 w-2" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                </span>
                                Active session:&nbsp;<span className="font-semibold text-white">{sessionLabel}</span>
                            </div>
                        )}
                    </div>
                </div>

                {dashboardType === 'parent' && (
                    <ParentDashboard
                        children={children ?? []}
                        invoices={invoices ?? []}
                        feeSummary={feeSummary}
                        activeSession={activeSession}
                        todayAttendance={todayAttendance ?? []}
                        subjectPapers={props.subjectPapers ?? []}
                        timetable={props.timetable ?? []}
                    />
                )}

                {dashboardType === 'student' && (
                    <StudentDashboard
                        enrollment={enrollment}
                        invoices={invoices ?? []}
                        activeSession={activeSession}
                        student={student}
                        timetable={props.timetable ?? []}
                    />
                )}

                {dashboardType === 'teacher' && (
                    <TeacherDashboard
                        assignments={assignments ?? []}
                        assignmentStats={assignmentStats}
                        activeSession={activeSession}
                        teacher={teacher}
                        timetable={props.timetable ?? []}
                    />
                )}

                {dashboardType !== 'parent' && dashboardType !== 'student' && dashboardType !== 'teacher' && (
                    <StaffDashboard
                        stats={stats}
                        quickActions={quickActions ?? []}
                        enrollmentsByClass={enrollmentsByClass}
                        assignmentOverview={props.assignmentOverview ?? []}
                        assignmentStats={props.assignmentStats ?? { total: 0, pending: 0, started: 0, completed: 0 }}
                        invoiceStats={props.invoiceStatusStats ?? { paid: 0, partial: 0, unpaid: 0, cancelled: 0, total: 0 }}
                        invoiceReferences={props.invoiceReferences ?? []}
                        timetable={props.timetable ?? []}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
