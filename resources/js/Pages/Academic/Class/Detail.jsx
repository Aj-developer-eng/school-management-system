import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { Link, router, useForm } from '@inertiajs/react';
import {
    Video,
    ArrowLeft,
    Clock,
    ClipboardCheck,
    GraduationCap,
    Users,
    Plus,
    StickyNote,
    Upload,
    X,
    Download,
    FileText,
} from 'lucide-react';
import { formatDate, formatDateTime, formatTimeRange } from '@/utils/format';
import { useAuth } from '@/utils/authorization';
import { confirmAction } from '@/utils/swal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';

const formatPaperSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

export default function Detail({
    class: schoolClass,
    classTimes = [],
    teacher = null,
    students = [],
    classworks = [],
    onlineClass = null,
}) {
    const { can, canAny } = useAuth();

    const [notesClassId, setNotesClassId] = useState(null);
    const [papersClassId, setPapersClassId] = useState(null);

    const notes = schoolClass?.notes ?? [];
    const papers = schoolClass?.papers ?? [];

    const canCreateNotes = can('classes.create-notes');
    const canDeleteNotes = can('classes.create-notes');
    const canManageNotes = canAny([
        'classes.create-notes',
        'classes.view-notes',
    ]);

    const canUploadPapers = can('classes.upload-papers');
    const canDownloadPapers = can('classes.download-papers');
    const canDeletePapers = can('classes.delete-papers');

    const canManagePapers = canAny([
        'classes.upload-papers',
        'classes.download-papers',
        'classes.delete-papers',
    ]);

    const notesClass =
        notesClassId === schoolClass?.id ? schoolClass : null;

    const papersClass =
        papersClassId === schoolClass?.id ? schoolClass : null;

    function NotesModal({ classItem, onClose, canCreate, canDelete }) {
        const { data, setData, post, processing, errors, reset } = useForm({
            body: '',
        });

        if (!classItem) return null;

        const classNotes = classItem.notes ?? [];

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

        const removeNote = async (note) => {
            const confirmed = await confirmAction({
                title: 'Delete Note',
                text: 'Delete this note? This cannot be undone.',
                confirmButtonText: 'Yes, delete it',
            });

            if (confirmed) {
                router.delete(
                    route('classes.notes.destroy', [
                        classItem.id,
                        note.id,
                    ]),
                    {
                        onSuccess: () =>
                            router.reload({ only: ['classes'] }),
                    }
                );
            }
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
                                {classNotes.length} note
                                {classNotes.length === 1 ? '' : 's'} · visible
                                to users with the view permission (parents of
                                this class&apos;s students)
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-4 pt-0">
                        {classNotes.length > 0 ? (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {classNotes.map((note) => (
                                    <li
                                        key={note.id}
                                        className="flex items-start justify-between gap-3 py-3"
                                    >
                                        <div>
                                            <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                                {note.body}
                                            </p>

                                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                                {note.creator?.name ?? 'Unknown'}
                                                {' · '}
                                                {formatDate(note.created_at)}
                                            </p>
                                        </div>

                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => removeNote(note)}
                                                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center gap-1 py-6 text-center">
                                <StickyNote className="h-6 w-6 text-gray-300" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No notes yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {canCreate && (
                        <form
                            onSubmit={submit}
                            className="border-t border-gray-200 p-4 dark:border-gray-700"
                        >
                            <div>
                                <InputLabel
                                    htmlFor="note_body"
                                    value="Note"
                                />

                                <textarea
                                    id="note_body"
                                    rows="3"
                                    value={data.body}
                                    onChange={(e) =>
                                        setData('body', e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                />

                                {Object.entries(errors)
                                    .filter(([key]) =>
                                        key.startsWith('body')
                                    )
                                    .map(([key, message]) => (
                                        <InputError
                                            key={key}
                                            message={message}
                                            className="mt-1"
                                        />
                                    ))}
                            </div>

                            <div className="mt-3 flex justify-end">
                                <PrimaryButton
                                    disabled={processing || !data.body.trim()}
                                >
                                    Add Note
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    function PapersModal({
        classItem,
        onClose,
        canUpload,
        canDownload,
        canDelete,
    }) {
        const { data, setData, post, processing, errors, reset } = useForm({
            papers: [],
        });

        const [formKey, setFormKey] = useState(0);

        if (!classItem) return null;

        const submit = (event) => {
            event.preventDefault();

            post(route('classes.papers.store', classItem.id), {
                forceFormData: true,
                preserveScroll: true,
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
                router.delete(
                    route('classes.papers.destroy', paper.id),
                    {
                        onSuccess: () =>
                            router.reload({ only: ['classes'] }),
                    }
                );
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
                                {(classItem.papers ?? []).length} uploaded ·
                                PDF/DOC/DOCX, max 20 MB each
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
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
                                                {formatPaperSize(paper.size)}
                                                {' · Uploaded '}
                                                {formatDate(paper.created_at)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            {canDownload && (
                                                <a
                                                    href={route(
                                                        'classes.papers.download',
                                                        paper.id
                                                    )}
                                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    Download
                                                </a>
                                            )}

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePaper(paper)
                                                    }
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No papers uploaded yet.
                                </p>
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
                                    onChange={(e) =>
                                        setData(
                                            'papers',
                                            Array.from(e.target.files ?? [])
                                        )
                                    }
                                    className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                                />

                                {Object.entries(errors)
                                    .filter(([key]) =>
                                        key.startsWith('papers')
                                    )
                                    .map(([key, message]) => (
                                        <InputError
                                            key={key}
                                            message={message}
                                            className="mt-1"
                                        />
                                    ))}
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton
                                    disabled={
                                        processing ||
                                        data.papers.length === 0
                                    }
                                >
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
                            <div
                                className={`rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/30 cursor-pointer ${canManageNotes ? 'hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors' : 'opacity-60'}`}
                                onClick={canManageNotes ? () => setNotesClassId(schoolClass?.id) : undefined}
                            >
                                <p className="text-xs uppercase text-indigo-600 dark:text-indigo-300">
                                    New Announcement
                                </p>

                                <p className="text-lg font-semibold">
                                    {notes.length}
                                </p>
                            </div>

                            <div
                                className={`rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/30 cursor-pointer ${canManagePapers ? 'hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors' : 'opacity-60'}`}
                                onClick={canManagePapers ? () => setPapersClassId(schoolClass?.id) : undefined}
                            >
                                <p className="text-xs uppercase text-emerald-600 dark:text-emerald-300">
                                    Notes
                                </p>

                                <p className="text-lg font-semibold">
                                    {papers.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Notes and Papers Actions */}
                <div className="flex gap-3">
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
                    {canManageNotes && (
                        <button
                            type="button"
                            onClick={() =>
                                setNotesClassId(schoolClass?.id)
                            }
                            title="View / add notes"
                            className="inline-flex flex-1 items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                            <StickyNote className="h-3.5 w-3.5" />
                            New Announcement{notes.length ? ` (${notes.length})` : ''}
                        </button>
                    )}

                    {canManagePapers && (
                        <button
                            type="button"
                            onClick={() =>
                                setPapersClassId(schoolClass?.id)
                            }
                            title="Upload / download papers"
                            className="inline-flex flex-1 items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Notes{papers.length ? ` (${papers.length})` : ''}
                        </button>
                    )}
                </div>

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
                                    .filter(
                                        (time) =>
                                            time.start_time || time.end_time
                                    )
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
                                    {formatDateTime(
                                        onlineClass.scheduled_at
                                    )}
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
                                            Due:{' '}
                                            {formatDateTime(classwork.due_date)}
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

                {notesClass && (
                    <NotesModal
                        classItem={notesClass}
                        onClose={() => setNotesClassId(null)}
                        canCreate={canCreateNotes}
                        canDelete={canDeleteNotes}
                    />
                )}

                {papersClass && (
                    <PapersModal
                        classItem={papersClass}
                        onClose={() => setPapersClassId(null)}
                        canUpload={canUploadPapers}
                        canDownload={canDownloadPapers}
                        canDelete={canDeletePapers}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}