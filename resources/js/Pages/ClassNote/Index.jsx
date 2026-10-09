import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import Pagination from '@/Components/Ui/Pagination';
import { formatDate } from '@/utils/format';
import { StickyNote } from 'lucide-react';

export default function Index({ notes }) {
    return (
        <AuthenticatedLayout
            title="Class Notes"
            breadcrumbs={[{ label: 'Class Notes' }]}
        >
            <Card>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(notes?.data ?? []).length > 0 ? (
                        notes.data.map((note) => (
                            <div key={note.id} className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                        <StickyNote className="h-3 w-3" />
                                        {note.school_class?.name ?? '—'}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                    {note.body}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Added by {note.creator?.name ?? 'Unknown'}
                                </p>
                            </div>
                        ))
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