import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Card from '@/Components/Ui/Card';
import { Loader2 } from 'lucide-react';

export default function GenerateForm({ classId, className, onGenerated }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const { data, setData, put, processing, errors } = useForm({
        scheduled_at: '',
        description: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        put(route('classes.online-class.generate', classId), {
            onSuccess: () => {
                setLoading(false);
                setMessage({ type: 'success', text: 'Online class generated successfully!' });
                setTimeout(() => {
                    onGenerated?.();
                }, 1500);
            },
            onError: (errors) => {
                setLoading(false);
                setMessage({ type: 'error', text: errors.message || 'Failed to generate class.' });
            },
        });
    };

    return (
        <div>
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Start Online Class</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Scheduled Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                id="scheduled_at"
                                value={data.scheduled_at}
                                onChange={(e) => setData('scheduled_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {errors.scheduled_at && <p className="text-xs text-red-600 mt-1">{errors.scheduled_at}</p>}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                rows="3"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            ></textarea>
                            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="animate-spin h-4 w-4" />}
                            {loading ? 'Generating...' : 'Generate Class'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
}