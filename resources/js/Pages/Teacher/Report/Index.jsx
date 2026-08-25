import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { formatDate, formatDateTimeTime } from '@/utils/format';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const actionColors = {
    started: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    reset: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function Index({ logs, teacherSummary, dateSummary, filters, teachers }) {
    const [fromDate, setFromDate] = useState(filters.from_date ?? '');
    const [toDate, setToDate] = useState(filters.to_date ?? '');
    const [teacherId, setTeacherId] = useState(filters.teacher_id ?? '');

    const applyFilters = () => {
        router.get(route('teacher-reports.index'), {
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
            teacher_id: teacherId || undefined,
        }, { preserve: true, preserveState: true });
    };

    return (
        <AuthenticatedLayout
            title="Teacher Reports"
            breadcrumbs={[{ label: 'Teachers' }, { label: 'Reports' }]}
        >
            <div className="space-y-6">
                {/* Filters */}
                <Card>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teacher</label>
                            <select
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">All teachers</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Apply
                        </button>
                    </div>
                </Card>

                {/* Teacher summary */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Teacher Summary
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Active Days</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Started</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Completed</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Reset</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Total Events</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teacherSummary.length > 0 ? teacherSummary.map((row) => (
                                    <tr key={row.teacher_id} className="border-b border-gray-100 dark:border-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.teacher_name}</td>
                                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{row.active_days}</td>
                                        <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400">{row.started_count}</td>
                                        <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">{row.completed_count}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{row.reset_count}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{row.total_events}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                            No data for the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Date-wise summary */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Date-wise Summary
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Active Teachers</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Started</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Completed</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Reset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dateSummary.length > 0 ? dateSummary.map((row) => (
                                    <tr key={row.log_date} className="border-b border-gray-100 dark:border-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatDate(row.log_date)}</td>
                                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{row.active_teachers}</td>
                                        <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400">{row.started_count}</td>
                                        <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">{row.completed_count}</td>
                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{row.reset_count}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                            No data for the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detailed logs */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Detailed Logs
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Section</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(log.log_date)}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {formatDateTimeTime(log.occurred_at)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                            {log.teacher?.user?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.schoolClass?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.section?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.subject?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? actionColors.reset}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                            No logs for the selected period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
