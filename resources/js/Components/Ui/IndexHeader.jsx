import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

export default function IndexHeader({ title, createRoute, canCreate, children }) {
    return (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <div className="flex flex-wrap items-center gap-2">
                {children}
                {canCreate && (
                    <Link
                        href={route(createRoute)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add
                    </Link>
                )}
            </div>
        </div>
    );
}
