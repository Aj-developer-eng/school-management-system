import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    FlaskConical,
    GraduationCap,
    Settings,
    UserPlus,
    Users,
} from 'lucide-react';

const iconMap = {
    UserPlus,
    GraduationCap,
    Users,
    BookOpen,
    FlaskConical,
    Settings,
    Calendar,
};

export default function QuickAction({ label, routeName, icon }) {
    const Icon = iconMap[icon] ?? UserPlus;

    return (
        <Link
            href={route(routeName)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </Link>
    );
}
