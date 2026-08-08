import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ routeName, params, confirmMessage = 'Are you sure?' }) {
    const handleClick = () => {
        if (window.confirm(confirmMessage)) {
            router.delete(route(routeName, params));
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
            <Trash2 size={16} />
        </button>
    );
}
