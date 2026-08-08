import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link } from '@inertiajs/react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

export default function Index({ assignments, activeSession }) {
    return (
        <AuthenticatedLayout
            title="Record Attendance"
            breadcrumbs={[{ label: 'Attendance' }]}
        >
            <Card>
                <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                My Class Assignments
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activeSession ? `Session: ${activeSession}` : 'Select a class to record attendance'}
                            </p>
                        </div>
                    </div>
                </div>

                {assignments.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {assignments.map((a) => (
                            <Link
                                key={a.id}
                                href={route('attendance.show', a.id)}
                                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                        {a.school_class?.name?.charAt(0) ?? '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {a.school_class?.name} {a.section?.name ? `— ${a.section.name}` : ''}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {a.subject?.name ?? 'General'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
                                    Record
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-gray-500 dark:text-gray-400">
                            No class assignments found for this session.
                        </p>
                    </div>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
