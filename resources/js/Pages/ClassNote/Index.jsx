import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import Pagination from '@/Components/Ui/Pagination';
import { formatDate } from '@/utils/format';
import { StickyNote, AlertTriangle } from 'lucide-react';

export default function Index({ notes, emptyClasses = [] }) {
    return (
        <AuthenticatedLayout
            title="Class Notes"
            breadcrumbs={[{ label: 'Class Notes' }]}
        >
            <Card>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Empty class warning section */}
                    {emptyClasses.length > 0 && (
                        <div className="p-4 pb-0">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Classes with no notes
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {emptyClasses.map((className) => (
                                    <div
                                        key={className.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20"
                                    >
                                        <div className="flex items-center gap-2">
                                            <StickyNote className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm text-amber-800 dark:text-amber-200">
                                                {className.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                            (no notes)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(notes?.data ?? []).length > 0 ? (
                        notes.data.map((note) => {
                            const hasMissingClass = !note.school_class;
                            return (
                                <div
                                    key={note.id}
                                    className={`p-4 ${hasMissingClass ? 'bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${hasMissingClass ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                                            <StickyNote className="h-3 w-3" />
                                            {hasMissingClass ? (
                                                <>
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Class missing
                                                </>
                                            ) : (
                                                note.school_class?.name ?? '—'
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                                    </div>
                                    {hasMissingClass ? (
                                        <p className="mt-2 whitespace-pre-line text-sm text-red-700 dark:text-red-300">
                                            <span className="font-medium">⚠️ This note is associated with a missing class.</span> The class has been deleted or is no longer available.
                                        </p>
                                    ) : (
                                        <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                            {note.body}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-400">
                                        Added by {note.creator?.name ?? 'Unknown'}
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center gap-1 py-10 text-center">
                            <StickyNote className="h-8 w-8 text-gray-300" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No class notes yet.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            <Pagination {...notes} />
        </AuthenticatedLayout>
    );
}