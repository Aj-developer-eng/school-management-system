import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { formatDateTime } from '@/utils/format';
import { Calendar, ExternalLink, GraduationCap, User, BookOpen } from 'lucide-react';

export default function ParentIndex({ onlineClasses }) {
    return (
        <AuthenticatedLayout
            title="Online Classes"
            breadcrumbs={[{ label: 'Academics' }, { label: 'Online Classes' }]}
        >
            <div className="space-y-4">
                {onlineClasses.length > 0 ? (
                    onlineClasses.map((cls) => (
                        <Card key={cls.id}>
                            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            {cls.title || 'Online Class'}
                                        </h3>
                                        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                            Active
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="inline-flex items-center gap-1.5">
                                            <GraduationCap size={15} />
                                            {cls.school_class?.name}
                                            {cls.section ? ` — ${cls.section.name}` : ''}
                                            {cls.student_name ? ` (${cls.student_name})` : ''}
                                        </span>
                                        {cls.subject?.name && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <BookOpen size={15} />
                                                {cls.subject.name}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5">
                                            <User size={15} />
                                            {cls.teacher?.user?.name ?? '—'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar size={15} />
                                            {formatDateTime(cls.scheduled_at)}
                                        </span>
                                    </div>

                                    {cls.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{cls.description}</p>
                                    )}
                                </div>

                                <a
                                    href={cls.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                                >
                                    <ExternalLink size={16} />
                                    Join Class
                                </a>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No active online classes for your children right now.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
