import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search…', autoSearch = false }) {
    const [term, setTerm] = useState(value ?? '');

    useEffect(() => {
        setTerm(value ?? '');
    }, [value]);

    useEffect(() => {
        if (!autoSearch) return;

        const timeout = setTimeout(() => {
            if (term !== (value ?? '')) {
                onChange(term);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [term, autoSearch, value, onChange]);

    return (
        <div className="relative w-full max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') onChange(term);
                }}
                placeholder={placeholder}
                className="w-full rounded-lg border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
            {term && (
                <button
                    type="button"
                    onClick={() => {
                        setTerm('');
                        onChange('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Clear"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
