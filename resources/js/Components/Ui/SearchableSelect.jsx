import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Filterable single select built on a text input.
 *
 * Options are `{ value, label, keywords? }` — the list is filtered by matching
 * the typed term against the label and any extra keywords, so an option can be
 * found by more than the text it displays (e.g. a student by name or reg no).
 */
export default function SearchableSelect({
    id,
    value,
    onChange,
    options = [],
    placeholder = 'Search…',
    emptyMessage = 'No matches found',
    disabled = false,
    className = 'relative mt-1',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = useMemo(
        () => options.find((option) => String(option.value) === String(value ?? '')),
        [options, value],
    );

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) return options;

        return options.filter((option) =>
            [option.label, option.keywords]
                .filter(Boolean)
                .some((text) => String(text).toLowerCase().includes(term)),
        );
    }, [options, query]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', onClickOutside);

        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        setActiveIndex((index) => Math.min(Math.max(index, 0), Math.max(filtered.length - 1, 0)));
    }, [filtered.length]);

    const openList = () => {
        if (disabled) return;

        setQuery('');
        setOpen(true);
        setActiveIndex(Math.max(options.findIndex((option) => String(option.value) === String(value ?? '')), 0));
    };

    const closeList = () => {
        setOpen(false);
        setQuery('');
    };

    const select = (option) => {
        onChange(String(option.value));
        closeList();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();

            if (!open) {
                openList();
                return;
            }

            setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();

            if (open && filtered[activeIndex]) select(filtered[activeIndex]);
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            closeList();
        }
    };

    const listId = id ? `${id}-listbox` : undefined;

    return (
        <div ref={containerRef} className={className}>
            <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={open ? listId : undefined}
                    aria-activedescendant={open && listId && filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                    autoComplete="off"
                    disabled={disabled}
                    value={open ? query : selected?.label ?? ''}
                    placeholder={placeholder}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={openList}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-md border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                />
                {value === '' || value === null || value === undefined ? (
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            closeList();
                            inputRef.current?.focus();
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label="Clear selection"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {open && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</li>
                    ) : (
                        filtered.map((option, index) => {
                            const isSelected = String(option.value) === String(value ?? '');

                            return (
                                <li
                                    key={option.value}
                                    id={listId ? `${listId}-${index}` : undefined}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <button
                                        type="button"
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => select(option)}
                                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                                            index === activeIndex
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                                : 'text-gray-700 dark:text-gray-200'
                                        }`}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && <Check size={16} className="shrink-0" />}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
}
