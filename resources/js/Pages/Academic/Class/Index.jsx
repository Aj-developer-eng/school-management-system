import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import CreateButton from '@/Components/Ui/CreateButton';
import DataTable from '@/Components/Ui/DataTable';
import DeleteButton from '@/Components/Ui/DeleteButton';
import EditLink from '@/Components/Ui/EditLink';
import Pagination from '@/Components/Ui/Pagination';
import SearchInput from '@/Components/Ui/SearchInput';
import StatusBadge from '@/Components/Ui/StatusBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { formatDate, formatTimeRange } from '@/utils/format';
import { confirmAction } from '@/utils/swal';
import { Link, router, useForm } from '@inertiajs/react';
import { Clock, Download, FileText, Paperclip, Search, StickyNote, Upload, X } from 'lucide-react';

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Index({ classes, filters }) {
    const { can, canAny } = useAuth();
    const handleSearch = useFilter('classes.index');
    const [studentsClass, setStudentsClass] = useState(null);
    // Track the modal by id (not by object) so it always renders the fresh
    // row from the refreshed `classes` props after an upload/delete.
    const [papersClassId, setPapersClassId] = useState(null);
    const [notesClassId, setNotesClassId] = useState(null);

    const canUploadPapers = can('classes.upload-papers');
    const canDownloadPapers = can('classes.download-papers');
    const canDeletePapers = can('classes.delete-papers');
    const canManagePapers = canAny([
        'classes.upload-papers',
        'classes.download-papers',
        'classes.delete-papers',
    ]);

    const canCreateNotes = can('classes.create-notes');
    const canManageNotes = canAny(['classes.create-notes', 'classes.view-notes']);

    const papersClass =
        (classes?.data ?? []).find((row) => row.id === papersClassId) ?? null;
    const notesClass =
        (classes?.data ?? []).find((row) => row.id === notesClassId) ?? null;

    // Rows arrive sorted by class time (server-side); group them per time slot
    // so the table is easier to scan. Each class is grouped under its earliest
    // class time; classes without a time land in a trailing group.
    const timeGroups = useMemo(() => {
        const groups = new Map();

        (classes?.data ?? []).forEach((row) => {
            const first = (row.class_times ?? []).find(
                (time) => time.start_time || time.end_time,
            );
            const key = first
                ? `${first.start_time ?? ''}|${first.end_time ?? ''}`
                : 'no-time';

            if (!groups.has(key)) {
                const timeLabel = first
                    ? formatTimeRange(first.start_time, first.end_time)
                    : '—';

                groups.set(key, {
                    key,
                    label: (
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {timeLabel === '—' ? 'No class time' : timeLabel}
                        </span>
                    ),
                    rows: [],
                });
            }

            groups.get(key).rows.push(row);
        });

        return [...groups.values()];
    }, [classes]);

    const columns = [
        { key: 'name', label: 'Name' },
        {
            key: 'active_from_session',
            label: 'Session',
            render: (row) => row.active_from_session?.name ?? '—',
        },
        {
            key: 'class_times',
            label: 'Class Time',
            render: (row) => {
                const ranges = (row.class_times ?? [])
                    .filter((time) => time.start_time || time.end_time)
                    .map((time) => formatTimeRange(time.start_time, time.end_time));

                return ranges.length > 0 ? ranges.join(', ') : '—';
            },
        },
        {
            key: 'students_count',
            label: 'Students',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => setStudentsClass(row)}
                    title="View students"
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
                >
                    {row.students_count ?? 0}
                </button>
            ),
        },
        
        ...(canManagePapers
            ? [
                  {
                      key: 'papers',
                      label: 'Papers',
                      render: (row) => (
                          <button
                              type="button"
                              onClick={() => setPapersClassId(row.id)}
                              title="View papers"
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                          >
                              <Paperclip className="h-3 w-3" />
                              {row.papers?.length ?? 0}
                          </button>
                      ),
                  },
              ]
            : []),
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '280px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {canManageNotes && (
                        <button
                            type="button"
                            onClick={() => setNotesClassId(row.id)}
                            title="View / add notes"
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                            <StickyNote className="h-3.5 w-3.5" />
                            Notes{row.notes?.length ? ` (${row.notes.length})` : ''}
                        </button>
                    )}
                    {canManagePapers && (
                        <button
                            type="button"
                            onClick={() => setPapersClassId(row.id)}
                            title="Upload / download papers"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Papers
                        </button>
                    )}
                    {can('classes.update') && <EditLink routeName="classes.edit" params={row.id} />}
                    {can('classes.delete') && <DeleteButton routeName="classes.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Classes"
            breadcrumbs={[{ label: 'Classes' }]}
            actions={can('classes.create') && <CreateButton routeName="classes.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or code…" />
                </div>
                <DataTable columns={columns} rows={classes} groups={timeGroups} />
                <Pagination {...classes} />
            </Card>

            <PapersModal
                classItem={papersClass}
                onClose={() => setPapersClassId(null)}
                canUpload={canUploadPapers}
                canDownload={canDownloadPapers}
                canDelete={canDeletePapers}
            />

            <NotesModal
                classItem={notesClass}
                onClose={() => setNotesClassId(null)}
                canCreate={canCreateNotes}
            />

            <StudentsModal classItem={studentsClass} onClose={() => setStudentsClass(null)} />
        </AuthenticatedLayout>
    );
}

function StudentsModal({ classItem, onClose }) {
    const [query, setQuery] = useState('');

    // Reset the search when a different class is opened.
    useEffect(() => {
        setQuery('');
    }, [classItem?.id]);

    if (!classItem) return null;

    const students = (classItem.students_list ?? []).filter((s) =>
        (s.student_name ?? '').toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Students — {classItem.name}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {students.length} of {(classItem.students_list ?? []).length} enrolled
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search student by name…"
                            className="w-full rounded-lg border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto p-4 pt-0">
                    {students.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {students.map((s) => (
                                <li key={s.student_id} className="py-2">
                                    <Link
                                        href={route('students.show', s.student_id)}
                                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-800"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {s.student_name}
                                            </p>
                                            <p className="truncate text-xs text-gray-400">
                                                {s.admission_number ?? 'No admission #'}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            {(classItem.students_list ?? []).length === 0
                                ? 'No students enrolled in this class.'
                                : `No students match "${query}".`}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function PapersModal({ classItem, onClose, canUpload, canDownload, canDelete }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        papers: [],
    });
    // Remounts the file input after each upload so the picked files are
    // cleared from the (uncontrolled) input element.
    const [formKey, setFormKey] = useState(0);

    if (!classItem) return null;

    const submit = (event) => {
        event.preventDefault();
        post(route('classes.papers.store', classItem.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setFormKey((key) => key + 1);
                router.reload({ only: ['classes'] });
            },
        });
    };

    const removePaper = async (paper) => {
        const confirmed = await confirmAction({
            title: 'Delete Paper',
            text: `Delete "${paper.original_name}"? This cannot be undone.`,
            confirmButtonText: 'Yes, delete it',
        });

        if (confirmed) {
            router.delete(route('classes.papers.destroy', paper.id), {
                onSuccess: () => router.reload({ only: ['classes'] }),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Papers — {classItem.name}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {(classItem.papers ?? []).length} uploaded · PDF/DOC/DOCX, max 20 MB each
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-72 overflow-y-auto p-4">
                    {classItem.papers?.length ? (
                        <ul className="space-y-2">
                            {classItem.papers.map((paper) => (
                                <li
                                    key={paper.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-gray-800 dark:text-gray-200">
                                            {paper.original_name}
                                        </p>
                                        <p className="truncate text-xs text-gray-400">
                                            {formatSize(paper.size)} · Uploaded {formatDate(paper.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {canDownload && (
                                            <a
                                                href={route('classes.papers.download', paper.id)}
                                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download
                                            </a>
                                        )}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => removePaper(paper)}
                                                className="text-xs font-medium text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center gap-1 py-6 text-center">
                            <FileText className="h-6 w-6 text-gray-300" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No papers uploaded yet.</p>
                        </div>
                    )}
                </div>

                {canUpload && (
                    <form
                        key={formKey}
                        onSubmit={submit}
                        className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700"
                    >
                        <div>
                            <InputLabel
                                htmlFor="paper_files"
                                value="Files (PDF, DOC, or DOCX — up to 10 files, 20 MB each)"
                            />
                            <input
                                id="paper_files"
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setData('papers', Array.from(e.target.files ?? []))}
                                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                            />
                            {Object.entries(errors)
                                .filter(([key]) => key.startsWith('papers'))
                                .map(([key, message]) => (
                                    <InputError key={key} message={message} className="mt-1" />
                                ))}
                        </div>
                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing || data.papers.length === 0}>
                                <Upload className="h-4 w-4" />
                                Upload
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function NotesModal({ classItem, onClose, canCreate }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
    });

    if (!classItem) return null;

    const notes = classItem.notes ?? [];

    const submit = (event) => {
        event.preventDefault();
        post(route('classes.notes.store', classItem.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                router.reload({ only: ['classes'] });
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Notes — {classItem.name}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {notes.length} note{notes.length === 1 ? '' : 's'} · visible to users with the
                            view permission (parents of this class&apos;s students)
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-4 pt-0">
                    {notes.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {notes.map((note) => (
                                <li key={note.id} className="py-3">
                                    <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                        {note.body}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {note.creator?.name ?? 'Unknown'} · {formatDate(note.created_at)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center gap-1 py-6 text-center">
                            <StickyNote className="h-6 w-6 text-gray-300" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
                        </div>
                    )}
                </div>

                {canCreate && (
                    <form onSubmit={submit} className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
                        <div>
                            <InputLabel htmlFor="note_body" value="Add a note" />
                            <textarea
                                id="note_body"
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                rows={3}
                                placeholder="Write a note for this class…"
                                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                            />
                            <InputError message={errors.body} className="mt-1" />
                        </div>
                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing || data.body.trim() === ''}>
                                <StickyNote className="h-4 w-4" />
                                Save Note
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
