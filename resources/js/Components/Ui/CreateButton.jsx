import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

export default function CreateButton({ routeName }) {
    return (
        <Link
            href={route(routeName)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
            <Plus size={16} /> Add
        </Link>
    );
}
