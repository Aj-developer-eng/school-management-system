import { router } from '@inertiajs/react';
import { useCallback, useRef } from 'react';

export default function useFilter(baseRoute, extra = {}) {
    const timeoutRef = useRef(null);

    return useCallback(
        (value, key = 'search') => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                // Keep the other active filters (e.g. the search term) so
                // filters compose instead of replacing each other. Empty
                // extra values are dropped so the query stays clean.
                const query = Object.fromEntries(
                    Object.entries(extra).filter(
                        ([, extraValue]) =>
                            extraValue !== undefined &&
                            extraValue !== null &&
                            extraValue !== '',
                    ),
                );

                if (value) {
                    query[key] = value;
                } else {
                    delete query[key];
                }

                router.get(route(baseRoute), query, {
                    preserveState: true,
                    preserveScroll: true,
                });
            }, 300);
        },
        [baseRoute, extra],
    );
}
