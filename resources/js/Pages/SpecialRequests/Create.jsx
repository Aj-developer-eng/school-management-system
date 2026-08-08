import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import { useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Create({ children, recipients }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        assigned_to: '',
        subject: '',
        body: '',
        request_type: 'general',
        priority: 'normal',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('special-requests.store'));
    };

    return (
        <AuthenticatedLayout
            title="New Special Request"
            breadcrumbs={[
                { label: 'Special Requests', href: route('special-requests.index') },
                { label: 'New' },
            ]}
        >
            <div className="mx-auto max-w-2xl space-y-6">
                <Link
                    href={route('special-requests.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Requests
                </Link>

                <Card>
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Submit a Special Request
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Send a request to the school administration or teachers.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5 p-6">
                        {/* Student selection */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Related Student {children.length > 0 && '(optional)'}
                            </label>
                            {children.length > 0 ? (
                                <select
                                    value={data.student_id}
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <option value="">— Select student —</option>
                                    {children.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-gray-400">No children linked to your account.</p>
                            )}
                            {errors.student_id && <p className="mt-1 text-xs text-red-500">{errors.student_id}</p>}
                        </div>

                        {/* Recipient selection */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Direct To
                            </label>
                            <select
                                value={data.assigned_to}
                                onChange={(e) => setData('assigned_to', e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="">— Anyone (General) —</option>
                                {recipients.map((r) => (
                                    <option key={`${r.type}-${r.id}`} value={r.id}>
                                        {r.name} ({r.type === 'admin' ? 'Super Admin' : 'Teacher'})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-400">Choose a specific teacher or admin, or leave open for general submission.</p>
                            {errors.assigned_to && <p className="mt-1 text-xs text-red-500">{errors.assigned_to}</p>}
                        </div>

                        {/* Request type */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Request Type
                            </label>
                            <select
                                value={data.request_type}
                                onChange={(e) => setData('request_type', e.target.value)}
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="general">General</option>
                                <option value="leave">Leave Application</option>
                                <option value="complaint">Complaint</option>
                                <option value="meeting">Meeting Request</option>
                                <option value="fee">Fee Related</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.request_type && <p className="mt-1 text-xs text-red-500">{errors.request_type}</p>}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Priority
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['low', 'normal', 'high', 'urgent'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setData('priority', p)}
                                        className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                            data.priority === p
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            {errors.priority && <p className="mt-1 text-xs text-red-500">{errors.priority}</p>}
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder="Brief title for your request"
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                        </div>

                        {/* Body */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Details
                            </label>
                            <textarea
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                rows={6}
                                placeholder="Describe your request in detail…"
                                className="w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            />
                            {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                            <Link
                                href={route('special-requests.index')}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                Submit Request
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
