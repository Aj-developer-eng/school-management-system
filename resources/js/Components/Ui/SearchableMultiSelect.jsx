import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Filterable multi select built on a text input.
 *
 * Options are `{ value, label, keywords? }` — the same shape as SearchableSelect,
 * filtered by matching the typed term against the label and any extra keywords.
 * Clicking an option toggles it and keeps the list open so several can be picked
 * in one go; the current selection is shown as removable chips below the input.
 */
export default function SearchableMultiSelect({
    id,
    values = [],
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

    const selectedValues = useMemo(
        () => (values ?? []).map((value) => String(value)),
        [values],
    );

    const selectedOptions = useMemo(
        () => options.filter((option) => selectedValues.includes(String(option.value))),
        [options, selectedValues],
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
    };

    const closeList = () => {
        setOpen(false);
        setQuery('');
    };

    const toggle = (option) => {
        const value = String(option.value);

        onChange(
            selectedValues.includes(value)
                ? selectedValues.filter((selectedValue) => selectedValue !== value)
                : [...selectedValues, value],
        );
    };

    const remove = (value) => {
        onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
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

            if (open && filtered[activeIndex]) toggle(filtered[activeIndex]);
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
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    autoComplete="off"
                    disabled={disabled}
                    value={query}
                    placeholder={placeholder}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                        setActiveIndex(0);
                    }}
                    onFocus={openList}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-md border-gray-300 bg-white py-2.5 pl-9 pr-16 text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                />
                <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                    {selectedValues.length > 0 ? (
                        <>
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                {selectedValues.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange([]);
                                    closeList();
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                aria-label="Clear selection"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                    )}
                </div>
            </div>

            {selectedOptions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                    {selectedOptions.map((option) => (
                        <span
                            key={option.value}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        >
                            <span className="max-w-48 truncate">{option.label}</span>
                            <button
                                type="button"
                                onClick={() => remove(String(option.value))}
                                className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200"
                                aria-label={`Remove ${option.label}`}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {open && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</li>
                    ) : (
                        filtered.map((option, index) => {
                            const isSelected = selectedValues.includes(String(option.value));

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
                                        onClick={() => toggle(option)}
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
