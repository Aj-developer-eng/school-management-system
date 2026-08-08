import { Link } from '@inertiajs/react';

export default function Pagination({ links, from, to, total }) {
    if (!links?.length || total <= 0) return null;

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-medium">{from}</span> to{' '}
                <span className="font-medium">{to}</span> of{' '}
                <span className="font-medium">{total}</span> results
            </p>
            <nav className="flex items-center gap-1">
                {links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            className={`rounded-md px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={index}
                            className="rounded-md bg-gray-50 px-3 py-1 text-sm text-gray-400 dark:bg-gray-800"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}
