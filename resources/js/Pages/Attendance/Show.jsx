import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import FlashMessages from '@/Components/FlashMessages';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Check, X, Clock, FileText, Save, Calendar } from 'lucide-react';

const statusConfig = {
    present: { label: 'Present', color: 'emerald', icon: Check, bg: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-500' },
    absent: { label: 'Absent', color: 'red', icon: X, bg: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-500' },
    late: { label: 'Late', color: 'amber', icon: Clock, bg: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-500' },
    excused: { label: 'Excused', color: 'sky', icon: FileText, bg: 'bg-sky-500', text: 'text-sky-700', ring: 'ring-sky-500' },
};

export default function Show({ assignment, students, date, activeSession }) {
    const [selectedDate, setSelectedDate] = useState(date);
    const [records, setRecords] = useState(() => {
        const map = {};
        students.forEach((s) => {
            map[s.student_id] = { status: s.status, remarks: s.remarks ?? '' };
        });
        return map;
    });

    const { processing } = useForm({});

    const setStatus = (studentId, status) => {
        setRecords((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], status },
        }));
    };

    const setRemarks = (studentId, remarks) => {
        setRecords((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks },
        }));
    };

    const markAll = (status) => {
        const updated = {};
        Object.keys(records).forEach((id) => {
            updated[id] = { ...records[id], status };
        });
        setRecords(updated);
    };

    const submit = (e) => {
        e.preventDefault();

        const payload = {
            attendance_date: selectedDate,
            records: Object.entries(records).map(([studentId, data]) => ({
                student_id: parseInt(studentId),
                status: data.status,
                remarks: data.remarks || null,
            })),
        };

        router.post(route('attendance.store', assignment.id), payload, {
            preserveScroll: true,
        });
    };

    const changeDate = (newDate) => {
        setSelectedDate(newDate);
        router.get(
            route('attendance.show', assignment.id),
            { date: newDate },
            {
                preserveScroll: true,
                only: ['students', 'date'],
                onSuccess: () => {
                    // Re-init records from fresh data
                },
            },
        );
    };

    const presentCount = Object.values(records).filter((r) => r.status === 'present').length;
    const absentCount = Object.values(records).filter((r) => r.status === 'absent').length;
    const lateCount = Object.values(records).filter((r) => r.status === 'late').length;
    const excusedCount = Object.values(records).filter((r) => r.status === 'excused').length;

    return (
        <AuthenticatedLayout
            title="Mark Attendance"
            breadcrumbs={[
                { label: 'Attendance', href: route('attendance.index') },
                { label: `${assignment.school_class?.name} ${assignment.section?.name ?? ''}` },
            ]}
        >
            <FlashMessages />

            <div className="space-y-6">
                {/* Header */}
                <Card>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {assignment.school_class?.name}
                                {assignment.section?.name ? ` — ${assignment.section.name}` : ''}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {assignment.subject?.name ?? 'General'} · {activeSession ?? 'Current Session'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => changeDate(e.target.value)}
                                    className="rounded-lg border-gray-300 pl-10 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4 sm:grid-cols-4 dark:border-gray-700">
                        <StatBadge count={presentCount} label="Present" color="emerald" />
                        <StatBadge count={absentCount} label="Absent" color="red" />
                        <StatBadge count={lateCount} label="Late" color="amber" />
                        <StatBadge count={excusedCount} label="Excused" color="sky" />
                    </div>
                </Card>

                {/* Bulk actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mark all:</span>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => markAll(key)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`}
                        >
                            <cfg.icon className="h-3.5 w-3.5" />
                            {cfg.label}
                        </button>
                    ))}
                </div>

                {/* Student list */}
                <form onSubmit={submit}>
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Roll</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Student</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length > 0 ? students.map((s) => {
                                        const current = records[s.student_id] ?? { status: 'present', remarks: '' };
                                        return (
                                            <tr key={s.student_id} className="border-b border-gray-50 dark:border-gray-700/50">
                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                                                    {s.roll_number ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                                    {s.name}
                                                    {s.has_record && (
                                                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" title="Already recorded" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1.5">
                                                        {Object.entries(statusConfig).map(([key, cfg]) => {
                                                            const isActive = current.status === key;
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    onClick={() => setStatus(s.student_id, key)}
                                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                                                                        isActive
                                                                            ? `${cfg.bg} border-transparent text-white`
                                                                            : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                                                                    }`}
                                                                    title={cfg.label}
                                                                >
                                                                    <cfg.icon className="h-4 w-4" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={current.remarks}
                                                        onChange={(e) => setRemarks(s.student_id, e.target.value)}
                                                        placeholder="Optional note…"
                                                        className="w-full rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No students enrolled in this class/section for the active session.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {students.length > 0 && (
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                Save Attendance
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

function StatBadge({ count, label, color }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    };

    return (
        <div className={`rounded-lg px-4 py-2 text-center ${colorClasses[color] ?? colorClasses.emerald}`}>
            <span className="block text-lg font-bold">{count}</span>
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
}
