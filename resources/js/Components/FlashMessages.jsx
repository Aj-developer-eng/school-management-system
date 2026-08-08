import { usePage } from '@inertiajs/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FlashMessages() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);

    const message = flash?.success ?? flash?.error;
    const isError = Boolean(flash?.error);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timeout = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timeout);
        }
    }, [message, flash]);

    if (!message || !visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
            <div
                role="alert"
                className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${
                    isError
                        ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950 dark:text-red-200'
                        : 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-950 dark:text-green-200'
                }`}
            >
                {isError ? (
                    <XCircle size={20} className="mt-0.5 shrink-0" />
                ) : (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                )}
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
