import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
    if (items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link
                href={route('dashboard')}
                className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Dashboard"
            >
                <Home size={14} />
            </Link>
            {items.map((item, index) => (
                <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                    {item.href && index < items.length - 1 ? (
                        <Link
                            href={item.href}
                            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
