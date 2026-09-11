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

export default function QuickAction({ label, routeName, icon, delay = 0 }) {
    const Icon = iconMap[icon] ?? UserPlus;

    return (
        <Link
            href={route(routeName)}
            className="group animate-rise flex flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-500/50"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 dark:shadow-indigo-500/10">
                <Icon size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-600 transition-colors duration-200 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-300">
                {label}
            </span>
        </Link>
    );
}
