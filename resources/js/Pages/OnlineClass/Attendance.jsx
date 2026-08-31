import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import FlashMessages from '@/Components/FlashMessages';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Check, X, Clock, FileText, Save, Users } from 'lucide-react';

const statusConfig = {
    present: { label: 'Present', icon: Check, bg: 'bg-emerald-500' },
    absent: { label: 'Absent', icon: X, bg: 'bg-red-500' },
    late: { label: 'Late', icon: Clock, bg: 'bg-amber-500' },
    excused: { label: 'Excused', icon: FileText, bg: 'bg-sky-500' },
};

export default function Attendance({ onlineClass, students }) {
    const [records, setRecords] = useState(() => {
        const map = {};
        students.forEach((s) => {
            map[s.student_id] = { status: s.status, remarks: s.remarks ?? '' };
        });
        return map;
    });

    const [saving, setSaving] = useState(false);

    const setStatus = (studentId, status) => {
        setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    };

    const setRemarks = (studentId, remarks) => {
        setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
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
        setSaving(true);
        const payload = {
            records: Object.entries(records).map(([studentId, data]) => ({
                student_id: parseInt(studentId),
                status: data.status,
                remarks: data.remarks || null,
            })),
        };
        router.post(route('online-classes.attendance.store', onlineClass.id), payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const presentCount = Object.values(records).filter((r) => r.status === 'present').length;
    const absentCount = Object.values(records).filter((r) => r.status === 'absent').length;
    const lateCount = Object.values(records).filter((r) => r.status === 'late').length;
    const excusedCount = Object.values(records).filter((r) => r.status === 'excused').length;

    return (
        <AuthenticatedLayout
            title="Mark Attendance"
            breadcrumbs={[
                { label: 'Online Classes', href: route('online-classes.index') },
                { label: 'Attendance' },
            ]}
        >
            <FlashMessages />

            <div className="space-y-6">
                <Card>
                    <div className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                <Users size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {onlineClass.title || 'Online Class'}
                                </h2>
                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                    {onlineClass.school_class?.name}
                                    {onlineClass.section?.name ? ` — ${onlineClass.section.name}` : ''}
                                    {onlineClass.subject?.name ? ` · ${onlineClass.subject.name}` : ''}
                                    {onlineClass.teacher?.user?.name ? ` · ${onlineClass.teacher.user.name}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4 sm:grid-cols-4 dark:border-gray-700">
                        <StatBadge count={presentCount} label="Present" color="emerald" />
                        <StatBadge count={absentCount} label="Absent" color="red" />
                        <StatBadge count={lateCount} label="Late" color="amber" />
                        <StatBadge count={excusedCount} label="Excused" color="sky" />
                    </div>
                </Card>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mark all:</span>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => markAll(key)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <cfg.icon size={14} />
                            {cfg.label}
                        </button>
                    ))}
                </div>

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
                                                                    <cfg.icon size={16} />
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
                                                No students enrolled in this class/section.
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
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save size={16} />
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
