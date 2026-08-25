import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import Pagination from '@/Components/Ui/Pagination';
import { formatDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ClipboardCheck, Filter, Check, X, Clock, FileText, Eye } from 'lucide-react';

const statusStyles = {
    present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    absent: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    late: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    excused: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
};

const statusIcons = { present: Check, absent: X, late: Clock, excused: FileText };

export default function Report({ records, summary, classes, filters, activeSession, isScoped }) {
    const [form, setForm] = useState({
        class_id: filters.class_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        status: filters.status ?? '',
    });

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(route('attendance.report'), form, { preserveScroll: true, preserveState: true });
    };

    const resetFilter = () => {
        setForm({ class_id: '', date_from: '', date_to: '', status: '' });
        router.get(route('attendance.report'), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title="Attendance Report"
            breadcrumbs={[{ label: 'Attendance' }, { label: 'Report' }]}
        >
            <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <SummaryCard label="Total Records" value={summary.total} color="indigo" />
                    <SummaryCard label="Present" value={summary.present} color="emerald" />
                    <SummaryCard label="Absent" value={summary.absent} color="red" />
                    <SummaryCard label="Late" value={summary.late} color="amber" />
                    <SummaryCard label="Excused" value={summary.excused} color="sky" />
                </div>

                {/* Filters */}
                <Card>
                    <form onSubmit={applyFilter} className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <Filter className="h-4 w-4" />
                                Filters
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Class</label>
                                <select
                                    value={form.class_id}
                                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                    disabled={isScoped}
                                    className="rounded-lg border-gray-300 text-sm disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <option value="">All Classes</option>
                                    {Object.entries(classes).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
                                <input
                                    type="date"
                                    value={form.date_from}
                                    onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                                    className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
                                <input
                                    type="date"
                                    value={form.date_to}
                                    onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                                    className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <option value="">All</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="excused">Excused</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                                    Apply
                                </button>
                                <button type="button" onClick={resetFilter} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Records table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Student</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Class</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Section</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Teacher</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Remarks</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.length > 0 ? records.data.map((r) => {
                                    const Icon = statusIcons[r.status] ?? Check;
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                                                {formatDate(r.attendance_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route('attendance.student', r.student_id)}
                                                    className="font-medium text-indigo-600 hover:text-indigo-700"
                                                >
                                                    {r.student?.user?.name ?? '—'}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {r.school_class?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {r.section?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {r.subject?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {r.assignment?.teacher?.user?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.status] ?? statusStyles.present}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                                {r.remarks ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={route('attendance.student', r.student_id)}
                                                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                                                    title="View student details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-3">No attendance records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination {...records} />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    };
    return (
        <div className={`rounded-xl p-4 ${colors[color] ?? colors.indigo}`}>
            <span className="block text-2xl font-bold">{value}</span>
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
}
