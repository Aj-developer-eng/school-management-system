import { router } from '@inertiajs/react';
import { useCallback, useRef } from 'react';

export default function useFilter(baseRoute, extra = {}) {
    const timeoutRef = useRef(null);

    return useCallback(
        (value, key = 'search') => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                const query = { ...extra };
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
