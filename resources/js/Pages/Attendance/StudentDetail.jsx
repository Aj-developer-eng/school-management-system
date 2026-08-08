import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Check, X, Clock, FileText, Calendar, User, BookOpen } from 'lucide-react';

const statusStyles = {
    present: 'bg-emerald-500 text-white',
    absent: 'bg-red-500 text-white',
    late: 'bg-amber-500 text-white',
    excused: 'bg-sky-500 text-white',
};

const statusBg = {
    present: 'bg-emerald-50 dark:bg-emerald-500/10',
    absent: 'bg-red-50 dark:bg-red-500/10',
    late: 'bg-amber-50 dark:bg-amber-500/10',
    excused: 'bg-sky-50 dark:bg-sky-500/10',
};

const statusIcons = { present: Check, absent: X, late: Clock, excused: FileText };

export default function StudentDetail({ student, records, summary, filters, activeSession }) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(
            route('attendance.student', student.id),
            { date_from: dateFrom, date_to: dateTo },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetFilter = () => {
        setDateFrom('');
        setDateTo('');
        router.get(route('attendance.student', student.id), {}, { preserveScroll: true });
    };

    const attendanceRate = summary.total > 0
        ? Math.round((summary.present / summary.total) * 100)
        : 0;

    return (
        <AuthenticatedLayout
            title={`${student.name} — Attendance`}
            breadcrumbs={[
                { label: 'Attendance', href: route('attendance.report') },
                { label: student.name },
            ]}
        >
            <div className="space-y-6">
                {/* Back link */}
                <Link
                    href={route('attendance.report')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Report
                </Link>

                {/* Student header + summary */}
                <Card>
                    <div className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                    {student.name?.charAt(0) ?? '?'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {student.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Admission #: {student.admission_number ?? '—'}
                                        {activeSession ? ` · ${activeSession}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600">{attendanceRate}%</div>
                                    <div className="text-xs font-medium text-gray-500">Attendance Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Summary stats */}
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                            <StatBox label="Total" value={summary.total} color="indigo" />
                            <StatBox label="Present" value={summary.present} color="emerald" />
                            <StatBox label="Absent" value={summary.absent} color="red" />
                            <StatBox label="Late" value={summary.late} color="amber" />
                            <StatBox label="Excused" value={summary.excused} color="sky" />
                        </div>
                    </div>
                </Card>

                {/* Date filter */}
                <Card>
                    <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-4 p-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                                Apply
                            </button>
                            <button type="button" onClick={resetFilter} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                Reset
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Attendance history — timeline style */}
                <Card>
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            Attendance History
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Date-wise records with teacher, class, and subject
                        </p>
                    </div>

                    {records.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {records.map((r) => {
                                const Icon = statusIcons[r.status] ?? Check;
                                return (
                                    <div key={r.id} className="flex items-start gap-4 px-6 py-4">
                                        {/* Status icon */}
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${statusStyles[r.status] ?? statusStyles.present}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {r.date}
                                                </span>
                                                <span className="text-xs text-gray-400">{r.day}</span>
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBg[r.status] ?? statusBg.present}`}>
                                                    {r.status}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                    {r.teacher ?? '—'}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                                                    {r.class}{r.section ? ` · ${r.section}` : ''}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {r.subject ?? 'General'}
                                                </span>
                                            </div>

                                            {r.remarks && (
                                                <p className="mt-1.5 text-sm italic text-gray-500 dark:text-gray-400">
                                                    "{r.remarks}"
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400">
                                                Recorded by {r.recorded_by ?? '—'} at {r.created_at}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                            <p className="mt-3 text-gray-500 dark:text-gray-400">
                                No attendance records found for this student.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function StatBox({ label, value, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    };
    return (
        <div className={`rounded-lg p-3 text-center ${colors[color] ?? colors.indigo}`}>
            <span className="block text-xl font-bold">{value}</span>
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
}
