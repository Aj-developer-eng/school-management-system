import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, X } from 'lucide-react';
import { visibleNavigation } from '@/config/navigation';
import { useAuth } from '@/utils/authorization';

export default function Sidebar({ open, onClose }) {
    const { can } = useAuth();
    const { url } = usePage();
    const groups = visibleNavigation(can);

    const isActive = (routeName) => {
        const href = route(routeName, undefined, false);
        return url === href || url.startsWith(`${href}?`) || url.startsWith(`${href}/`);
    };

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-700 dark:bg-gray-800 lg:translate-x-0 ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
                    <Link href={route('dashboard')} className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <GraduationCap size={20} />
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            School Management
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                    {groups.map((group, index) => (
                        <div key={group.section ?? `group-${index}`}>
                            {group.section && (
                                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    {group.section}
                                </p>
                            )}
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.routeName);

                                    return (
                                        <li key={item.routeName}>
                                            <Link
                                                href={route(item.routeName)}
                                                onClick={onClose}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                    active
                                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100'
                                                }`}
                                            >
                                                <Icon size={18} className="shrink-0" />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
