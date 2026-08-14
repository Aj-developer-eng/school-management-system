import Dropdown from '@/Components/Dropdown';
import { Link, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function NotificationBell() {
    const { notifications } = usePage().props;
    const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

    const markAsRead = (id) => {
        router.post(route('notifications.read', id), {}, { preserveScroll: true });
    };

    const markAllAsRead = () => {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true });
    };

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="80" contentClasses="py-0 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            <CheckCheck size={14} /> Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {(notifications ?? []).length > 0 ? (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`border-b border-gray-50 px-4 py-3 last:border-0 dark:border-gray-700/50 ${!n.read_at ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                {n.message}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                                            {n.created_at}
                                        </p>
                                    </div>
                                    {!n.read_at && (
                                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                                    )}
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                    {n.link && (
                                        <Link
                                            href={n.link}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                        >
                                            View
                                        </Link>
                                    )}
                                    {!n.read_at && (
                                        <button
                                            type="button"
                                            onClick={() => markAsRead(n.id)}
                                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <Bell size={24} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                No notifications
                            </p>
                        </div>
                    )}
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
