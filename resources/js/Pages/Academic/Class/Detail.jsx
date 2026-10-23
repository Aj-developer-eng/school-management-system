import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link } from '@inertiajs/react';

export default function Detail({ class: schoolClass, classTimes = [], teacher = null, students = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Class Details</h2>}>
            <div className="space-y-6">
                <Card>
                    <h3 className="text-lg font-semibold mb-2">{schoolClass?.name}</h3>
                    <p className="text-sm text-gray-600">Code: {schoolClass?.code}</p>
                    <p className="text-sm text-gray-600">Level: {schoolClass?.level}</p>
                </Card>


                <Card>
                    <h3 className="text-lg font-semibold mb-2">Class Times</h3>
                    {classTimes.length ? (
                        <ul className="list-disc pl-5">
                            {classTimes.map((t, i) => (
                                <li key={i}>{t.start_time} — {t.end_time}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No class times.</p>
                    )}
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-2">Teacher</h3>
                    {teacher ? (
                        <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-sm text-gray-600">{teacher.employee_code}</p>
                            <p className="text-sm text-gray-600">{teacher.qualification}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No teacher assigned.</p>
                    )}
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-2">Students ({students.length})</h3>
                    {students.length ? (
                        <ul className="divide-y">
                            {students.map((s) => (
                                <li key={s.id} className="py-2">
                                    {s.name} ({s.admission_number})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No students.</p>
                    )}
                </Card>

                <Link href={route('classes.index')} className="text-blue-600 underline">
                    Back to classes
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
