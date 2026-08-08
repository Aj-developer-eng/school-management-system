import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';

export default function EditLink({ routeName, params }) {
    return (
        <Link
            href={route(routeName, params)}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
            <Pencil size={16} />
        </Link>
    );
}
