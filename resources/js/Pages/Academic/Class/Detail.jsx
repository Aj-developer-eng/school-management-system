
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link } from '@inertiajs/react';
import {
    Video,
    ArrowLeft,
    Clock,
    ClipboardCheck,
    GraduationCap,
    Users,
    Plus,
} from 'lucide-react';
import { formatDateTime, formatTimeRange } from '@/utils/format';
import { useAuth } from '@/utils/authorization';

export default function Detail({
    class: schoolClass,
    classTimes = [],
    teacher = null,
    students = [],
    classworks = [],
    onlineClass = null,
}) {
    const { can } = useAuth();

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('classes.index')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>

                    <h2 className="text-xl font-semibold">
                        Class Details
                    </h2>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Class Information */}
                <Card className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {schoolClass?.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                                Code: {schoolClass?.code || '—'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/30">
                                <p className="text-xs uppercase text-indigo-600 dark:text-indigo-300">
                                    Level
                                </p>

                                <p className="text-lg font-semibold">
                                    {schoolClass?.level ?? '—'}
                                </p>
                            </div>

                            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/30">
                                <p className="text-xs uppercase text-emerald-600 dark:text-emerald-300">
                                    Students
                                </p>

                                <p className="text-lg font-semibold">
                                    {students.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Class Times and Teacher */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold">
                                Class Times
                            </h3>
                        </div>

                        {classTimes.length > 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {classTimes
                                    .filter((time) => time.start_time || time.end_time)
                                    .map((time) =>
                                        formatTimeRange(
                                            time.start_time,
                                            time.end_time
                                        )
                                    )
                                    .join(', ')}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No class times assigned.
                            </p>
                        )}
                    </Card>

                    <Card className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold">
                                Teacher
                            </h3>
                        </div>

                        {teacher ? (
                            <div className="space-y-1">
                                <p className="font-medium">
                                    {teacher.name}
                                </p>

                                <p className="text-sm text-gray-600">
                                    Employee Code: {teacher.employee_code}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No teacher assigned.
                            </p>
                        )}
                    </Card>
                </div>

                {/* Online Class */}
                {onlineClass && (
                    <Card className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Video className="h-5 w-5 text-indigo-600" />

                            <h3 className="text-lg font-semibold">
                                Online Class
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {onlineClass.title || 'Live online class'}
                            </p>

                            {onlineClass.scheduled_at && (
                                <p className="text-xs text-gray-400">
                                    {formatDateTime(onlineClass.scheduled_at)}
                                </p>
                            )}

                            {can('online-classes.take') ? (
                                <Link
                                    href={route(
                                        'classes.online-class.take',
                                        {
                                            school_class: schoolClass?.id,
                                        }
                                    )}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <Video className="h-4 w-4" />
                                    Join Online Class
                                </Link>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    You need permission to join an online class.
                                </p>
                            )}

                            {can('viewClassworks') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.location.href = route(
                                            'classes.online-class.generate',
                                            schoolClass.id
                                        );
                                    }}
                                    className="flex items-center gap-2 rounded-md border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                                >
                                    <Plus className="h-4 w-4" />
                                    Generate Class
                                </button>
                            )}
                        </div>
                    </Card>
                )}

                {/* Students */}
                <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />

                        <h3 className="text-lg font-semibold">
                            Students
                        </h3>
                    </div>

                    {students.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                            Name
                                        </th>

                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                            Admission No.
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-4 py-2 text-sm">
                                                <Link
                                                    href={`/students/${student.id}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {student.name}
                                                </Link>
                                            </td>

                                            <td className="px-4 py-2 text-sm">
                                                {student.admission_number}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No students enrolled.
                        </p>
                    )}
                </Card>

                {/* Classwork */}
                <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-indigo-600" />

                        <h3 className="text-lg font-semibold">
                            Classwork
                        </h3>
                    </div>

                    {classworks.length > 0 ? (
                        <div className="space-y-4">
                            {classworks.map((classwork) => (
                                <div
                                    key={classwork.id}
                                    className={`rounded-lg border p-4 ${
                                        classwork.type === 'announcement'
                                            ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5'
                                            : 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/5'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {classwork.title}
                                        </h4>

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                classwork.type === 'announcement'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                            }`}
                                        >
                                            {classwork.type === 'announcement'
                                                ? 'Announcement'
                                                : 'Assignment'}
                                        </span>
                                    </div>

                                    {classwork.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {classwork.description}
                                        </p>
                                    )}

                                    {classwork.due_date && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Due: {formatDateTime(classwork.due_date)}
                                        </p>
                                    )}

                                    {classwork.creator && (
                                        <p className="mt-1 text-xs text-gray-400">
                                            Posted by {classwork.creator.name}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            No classwork yet.
                        </p>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
