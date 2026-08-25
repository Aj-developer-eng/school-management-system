import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import PrimaryButton from '@/Components/PrimaryButton';
import { useAuth } from '@/utils/authorization';
import { formatDate, formatDateTime } from '@/utils/format';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const statusColors = {
    announced: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    conducted: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    results_published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function Show({ test, students }) {
    const { can } = useAuth();
    const [results, setResults] = useState(
        Object.fromEntries(
            (students ?? []).map((s) => [
                s.id,
                {
                    marks_obtained: s.result?.marks_obtained ?? '',
                    is_absent: s.result?.is_absent ?? false,
                    remarks: s.result?.remarks ?? '',
                },
            ]),
        ),
    );

    const updateResult = (studentId, field, value) => {
        setResults((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value },
        }));
    };

    const saveResults = (e) => {
        e.preventDefault();
        const payload = Object.entries(results).map(([studentId, data]) => ({
            student_id: Number(studentId),
            ...data,
        }));
        router.post(route('tests.results.store', test.id), { results: payload }, { preserveScroll: true });
    };

    const markConducted = () => {
        router.patch(route('tests.conducted', test.id), {}, { preserveScroll: true });
    };

    const publishResults = () => {
        router.patch(route('tests.publish', test.id), {}, { preserveScroll: true });
    };

    const statusValue = test.status?.value ?? test.status;
    const canUploadResults = can('tests.upload-results') && statusValue !== 'announced';
    const canMarkConducted = can('tests.update') && statusValue === 'announced';
    const canPublish = can('tests.upload-results') && statusValue === 'conducted' && (test.results?.length ?? 0) > 0;

    return (
        <AuthenticatedLayout
            title={`Test: ${test.title}`}
            breadcrumbs={[
                { label: 'Tests', href: route('tests.index') },
                { label: test.title },
            ]}
        >
            <div className="space-y-6">
                {/* Test header */}
                <Card>
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {test.title}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {test.school_class?.name}
                                {test.section ? ` — ${test.section?.name}` : ''}
                                {' · '}{test.subject?.name}
                                {' · '}{test.test_type?.label ?? test.test_type}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Date: {formatDate(test.test_date)} · Total Marks: {Number(test.total_marks)} · Passing: {Number(test.passing_marks)}
                            </p>
                            {test.description && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{test.description}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[test.status?.value ?? test.status] ?? statusColors.announced}`}>
                                {test.status?.label ?? test.status}
                            </span>
                            {test.results_published_at && (
                                <p className="mt-2 text-xs text-gray-400">
                                    Published: {formatDateTime(test.results_published_at)}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                    {canMarkConducted && (
                        <PrimaryButton onClick={markConducted}>
                            Mark as Conducted
                        </PrimaryButton>
                    )}
                    {canPublish && (
                        <button
                            onClick={publishResults}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                            Publish Results & Notify Parents
                        </button>
                    )}
                </div>

                {/* Results entry / display */}
                {statusValue !== 'announced' && (students?.length ?? 0) > 0 && (
                    <Card>
                        <div className="flex items-center justify-between p-6 pb-0">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Student Results {statusValue === 'results_published' && '(Published)'}
                            </h3>
                        </div>
                        <form onSubmit={saveResults} className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Roll #</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Student</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Marks</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Grade</th>
                                            <th className="py-2 text-center font-medium text-gray-500 dark:text-gray-400">Absent</th>
                                            <th className="py-2 text-left font-medium text-gray-500 dark:text-gray-400">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => {
                                            const result = results[s.id] ?? { marks_obtained: '', is_absent: false, remarks: '' };
                                            return (
                                                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                                    <td className="py-3 text-gray-500 dark:text-gray-400">{s.roll_number ?? '—'}</td>
                                                    <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                                                    <td className="py-3">
                                                        {canUploadResults ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={Number(test.total_marks)}
                                                                value={result.marks_obtained}
                                                                onChange={(e) => updateResult(s.id, 'marks_obtained', e.target.value)}
                                                                disabled={result.is_absent}
                                                                className="w-24 rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                                            />
                                                        ) : (
                                                            s.result?.marks_obtained
                                                                ? Number(s.result.marks_obtained)
                                                                : '—'
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {s.result?.grade ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        {canUploadResults ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={result.is_absent}
                                                                onChange={(e) => updateResult(s.id, 'is_absent', e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                                            />
                                                        ) : (
                                                            s.result?.is_absent ? 'Yes' : 'No'
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        {canUploadResults ? (
                                                            <input
                                                                type="text"
                                                                value={result.remarks}
                                                                onChange={(e) => updateResult(s.id, 'remarks', e.target.value)}
                                                                className="w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                                            />
                                                        ) : (
                                                            s.result?.remarks ?? '—'
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {canUploadResults && (
                                <div className="mt-6 flex justify-end">
                                    <PrimaryButton>Save Results</PrimaryButton>
                                </div>
                            )}
                        </form>
                    </Card>
                )}

                {statusValue === 'announced' && (
                    <Card>
                        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            This test has been announced. After conducting the test, mark it as conducted to enable result entry.
                        </div>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
