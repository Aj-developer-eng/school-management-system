import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import StatusBadge from '@/Components/Ui/StatusBadge';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';

export default function Show({ student, parents }) {
    return (
        <AuthenticatedLayout
            title={student.name}
            breadcrumbs={[{ label: 'Students', href: route('students.index') }, { label: student.name }]}
        >
            <div className="space-y-6">
                {/* Student info */}
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {student.name}
                            </h2>
                            <StatusBadge active={student.is_active} />
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Admission #</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.admission_number}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.email ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.phone ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date of Birth</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.date_of_birth ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Gender</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{student.gender ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Current Class</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                    {student.current_class
                                        ? `${student.current_class.class} ${student.current_class.section} (${student.current_class.session})`
                                        : 'Not enrolled'}
                                </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Address</span>
                                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{student.address ?? '—'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Parents */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Associated Parents / Guardians
                    </h3>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {parents.length > 0 ? parents.map((parent) => (
                            <Card key={parent.id}>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{parent.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {parent.guardian_type ?? 'Guardian'}
                                                    {parent.is_primary_contact && (
                                                        <span className="ml-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                            Primary Contact
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge active={parent.is_active} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.email ?? '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.phone ?? '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Occupation</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.occupation ?? '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">CNIC</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.cnic ?? '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Emergency Contact</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.emergency_contact ?? '—'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Address</span>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{parent.address ?? '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <Card>
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    No parents associated with this student.
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link
                        href={route('students.index')}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Back to Students
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
