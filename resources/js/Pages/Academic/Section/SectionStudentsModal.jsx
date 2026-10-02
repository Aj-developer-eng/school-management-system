import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/Ui/StatusBadge';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function SectionStudentsModal({ show, section, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        if (!show || !section) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
            const response = await fetch(route('sections.students', section.id) + query, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Unable to load students.');
            }

            setData(await response.json());
        } catch (exception) {
            setError(exception.message || 'Unable to load students.');
        } finally {
            setLoading(false);
        }
    }, [show, section, search]);

    // Reset and (re)load whenever the modal is opened for a section.
    useEffect(() => {
        if (show) {
            setSearch('');
            setData(null);
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, section?.id]);

    const students = useMemo(() => data?.students ?? [], [data]);
    const subtitle = section
        ? [
              section.school_class?.name ?? section.school_class,
              section.name,
              section.academic_session?.name ?? section.academic_session,
          ]
              .filter(Boolean)
              .join(' • ')
        : '';

    return (
        <Modal show={show} onClose={onClose} maxWidth="4xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Enrolled Students
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-4">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyUp={(event) => {
                        if (event.key === 'Enter') {
                            load();
                        }
                    }}
                    placeholder="Search by name, email or admission #… then press Enter"
                    className="w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                />
            </div>

            <div className="max-h-80 overflow-y-auto">
                {loading && (
                    <p className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">Loading students…</p>
                )}

                {!loading && error && (
                    <p className="px-4 pb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {!loading && !error && students.length === 0 && (
                    <p className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
                        No students are enrolled in this section yet.
                    </p>
                )}

                {!loading && !error && students.length > 0 && (
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Roll #</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Admission #</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {students.map((student) => (
                                <tr key={student.id} className="bg-white dark:bg-gray-800">
                                    <td className="px-4 py-3 whitespace-nowrap">{student.roll_number ?? '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                        {student.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {student.admission_number ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">{student.email ?? '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <StatusBadge active={student.is_active} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {data ? `${data.total} student${data.total === 1 ? '' : 's'}` : ''}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}
