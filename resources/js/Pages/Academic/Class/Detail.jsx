import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock, GraduationCap, Users } from 'lucide-react';
import { formatTimeRange } from '@/utils/format';


export default function Detail({ class: schoolClass, classTimes = [], teacher = null, students = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link href={route('classes.index')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h2 className="text-xl font-semibold">Class Details</h2>
                </div>
            }
        >
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{schoolClass?.name}</h3>
                            <p className="text-sm text-gray-500">Code: {schoolClass?.code || '—'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/30">
                                <p className="text-xs uppercase text-indigo-600 dark:text-indigo-300">Level</p>
                                <p className="text-lg font-semibold">{schoolClass?.level ?? '—'}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/30">
                                <p className="text-xs uppercase text-emerald-600 dark:text-emerald-300">Students</p>
                                <p className="text-lg font-semibold">{students.length}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold">Class Times</h3>
                        </div>
                    {classTimes.length ? (
                        <ul className="space-y-2">
                            {classTimes.map((t, i) => (
                                <li key={i} className="rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                                    {formatTimeRange(t.start_time, t.end_time)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No class times assigned.</p>
                    )}
                    </Card>

                    <Card className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold">Teacher</h3>
                        </div>
                        {teacher ? (
                            <div className="space-y-1">
                                <p className="font-medium">{teacher.name}</p>
                                <p className="text-sm text-gray-600">Employee Code: {teacher.employee_code}</p>
                                {/* <p className="text-sm text-gray-600">Qualification: {teacher.qualification}</p>
                                {teacher.bio && teacher.bio !== '—' && (
                                    <p className="text-sm text-gray-600">Bio: {teacher.bio}</p>
                                )} */}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No teacher assigned.</p>
                        )}
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold">Students</h3>
                    </div>
                    {students.length ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Admission No.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {students.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-4 py-2 text-sm">
                                                <Link
                                                    href={`/students/${s.id}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {s.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 text-sm">{s.admission_number}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No students enrolled.</p>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
