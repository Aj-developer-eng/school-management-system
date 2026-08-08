export default function StatusBadge({ active, label }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                active
                    ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
        >
            {label ?? (active ? 'Active' : 'Inactive')}
        </span>
    );
}
