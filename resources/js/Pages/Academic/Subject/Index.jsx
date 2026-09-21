import { useState } from 'react';
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
import TextInput from '@/Components/TextInput';
import useFilter from '@/hooks/useFilter';
import { useAuth } from '@/utils/authorization';
import { confirmAction } from '@/utils/swal';
import { router, useForm } from '@inertiajs/react';
import { Download, FileText, Paperclip, Upload, X } from 'lucide-react';

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Index({ subjects, filters }) {
    const { can } = useAuth();
    const handleSearch = useFilter('subjects.index');

    const [paperSubject, setPaperSubject] = useState(null);

    const canUpload = can('subjects.upload-papers');
    const canDownload = can('subjects.download-papers') || can('subjects.upload-papers');
    const canDeletePapers = can('subjects.delete-papers');

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        {
            key: 'school_classes',
            label: 'Classes',
            render: (row) =>
                row.school_classes?.length
                    ? row.school_classes.map((c) => c.name).join(', ')
                    : '—',
        },
        {
            key: 'papers',
            label: 'Papers',
            render: (row) =>
                row.papers?.length ? (
                    <button
                        type="button"
                        onClick={() => setPaperSubject(row)}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                    >
                        <Paperclip className="h-3 w-3" />
                        {row.papers.length}
                    </button>
                ) : (
                    <span className="text-gray-400">0</span>
                ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => <StatusBadge active={row.is_active} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '180px',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {(canUpload || canDownload) && (
                        <button
                            type="button"
                            onClick={() => setPaperSubject(row)}
                            title="Upload / download papers"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Papers
                        </button>
                    )}
                    {can('subjects.update') && <EditLink routeName="subjects.edit" params={row.id} />}
                    {can('subjects.delete') && <DeleteButton routeName="subjects.destroy" params={row.id} />}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            title="Subjects"
            breadcrumbs={[{ label: 'Subjects' }]}
            actions={can('subjects.create') && <CreateButton routeName="subjects.create" />}
        >
            <Card>
                <div className="p-4">
                    <SearchInput value={filters.search} onChange={handleSearch} placeholder="Search by name or code…" />
                </div>
                <DataTable columns={columns} rows={subjects} />
                <Pagination {...subjects} />
            </Card>

            <PapersModal
                subject={paperSubject}
                onClose={() => setPaperSubject(null)}
                canUpload={canUpload}
                canDownload={canDownload}
                canDelete={canDeletePapers}
            />
        </AuthenticatedLayout>
    );
}

function PapersModal({ subject, onClose, canUpload, canDownload, canDelete }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        file: null,
    });

    if (!subject) return null;

    const submit = (event) => {
        event.preventDefault();
        post(route('subjects.papers.store', subject.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                router.reload({ only: ['subjects'] });
            },
        });
    };

    const removePaper = async (paper) => {
        const confirmed = await confirmAction({
            title: 'Delete Paper',
            text: `Delete "${paper.title}"? This cannot be undone.`,
            confirmButtonText: 'Yes, delete it',
        });

        if (confirmed) {
            router.delete(route('subject-papers.destroy', paper.id), {
                onSuccess: () => router.reload({ only: ['subjects'] }),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Papers — {subject.name}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-72 overflow-y-auto p-4">
                    {subject.papers?.length ? (
                        <ul className="space-y-2">
                            {subject.papers.map((paper) => (
                                <li
                                    key={paper.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-gray-800 dark:text-gray-200">
                                            {paper.title}
                                        </p>
                                        <p className="truncate text-xs text-gray-400">
                                            {paper.original_name} · {formatSize(paper.size)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {canDownload && (
                                            <a
                                                href={route('subject-papers.download', paper.id)}
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
                    <form onSubmit={submit} className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
                        <div>
                            <InputLabel htmlFor="paper_title" value="Title" />
                            <TextInput
                                id="paper_title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="e.g. 2025 Past Paper"
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="paper_file" value="File (PDF, DOC, or image, max 10MB)" />
                            <input
                                id="paper_file"
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => setData('file', e.target.files[0])}
                                className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                            />
                            <InputError message={errors.file} className="mt-1" />
                        </div>
                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing || !data.file}>
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
