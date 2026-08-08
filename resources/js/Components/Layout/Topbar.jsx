import { Link } from '@inertiajs/react';
import { ChevronDown, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';
import GlobalSearch from '@/Components/Layout/GlobalSearch';
import useDarkMode from '@/hooks/useDarkMode';
import { useAuth } from '@/utils/authorization';

export default function Topbar({ onOpenSidebar }) {
    const { user, roles } = useAuth();
    const { isDark, toggle } = useDarkMode();

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
            <button
                type="button"
                onClick={onOpenSidebar}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
                aria-label="Open sidebar"
            >
                <Menu size={20} />
            </button>

            <GlobalSearch />

            <div className="ml-auto flex items-center gap-2">
                <button
                    type="button"
                    onClick={toggle}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    aria-label="Toggle dark mode"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                {user?.photo_url ? (
                                    <img src={user.photo_url} alt={user?.name} className="h-full w-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0)?.toUpperCase()
                                )}
                            </span>
                            <span className="hidden text-left sm:block">
                                <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {user?.name}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {roles[0] ?? ''}
                                </span>
                            </span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                    </Dropdown.Trigger>

                    <Dropdown.Content>
                        <Dropdown.Link href={route('profile.edit')}>
                            <span className="flex items-center gap-2">
                                <User size={14} /> Profile
                            </span>
                        </Dropdown.Link>
                        <Dropdown.Link href={route('logout')} method="post" as="button">
                            <span className="flex items-center gap-2">
                                <LogOut size={14} /> Log Out
                            </span>
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </header>
    );
}
