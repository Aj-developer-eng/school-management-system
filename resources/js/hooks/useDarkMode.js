import { useCallback, useEffect, useState } from 'react';

export default function useDarkMode() {
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined'
            ? document.documentElement.classList.contains('dark')
            : false,
    );

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const toggle = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.theme = next ? 'dark' : 'light';
            return next;
        });
    }, []);

    return { isDark, toggle };
}
