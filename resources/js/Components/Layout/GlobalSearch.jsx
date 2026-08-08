import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { visibleNavigation } from '@/config/navigation';
import { useAuth } from '@/utils/authorization';

export default function GlobalSearch() {
    const { can } = useAuth();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const items = useMemo(
        () => visibleNavigation(can).flatMap((group) => group.items),
        [can],
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const term = query.trim().toLowerCase();
        return items.filter((item) => item.label.toLowerCase().includes(term)).slice(0, 8);
    }, [items, query]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };
        const onClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onClickOutside);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, []);

    const goTo = (item) => {
        setQuery('');
        setOpen(false);
        router.visit(route(item.routeName));
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            goTo(results[activeIndex]);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative hidden w-full max-w-md md:block">
            <div className="relative">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search modules… (Ctrl+K)"
                    className="w-full rounded-lg border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                />
            </div>

            {open && results.length > 0 && (
                <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {results.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.routeName}>
                                <button
                                    type="button"
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => goTo(item)}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                                        index === activeIndex
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                            : 'text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
