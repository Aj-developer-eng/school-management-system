import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                serif: ['"Playfair Display"', 'serif'],
            },
            colors: {
                navy: {
                    DEFAULT: '#0f172a',
                    foreground: '#f8fafc',
                },
                gold: {
                    DEFAULT: '#d4a017',
                    foreground: '#0f172a',
                },
            },
            boxShadow: {
                card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
                'card-hover': '0 12px 24px -6px rgb(0 0 0 / 0.12), 0 8px 16px -8px rgb(0 0 0 / 0.08)',
                hero: '0 20px 50px -12px rgb(0 0 0 / 0.25)',
                    float: '0 8px 24px -4px rgb(0 0 0 / 0.15)',
            },
            keyframes: {
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                rise: {
                    '0%': { opacity: '0', transform: 'translateY(12px) scale(0.99)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.92)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'float-slow': 'float-slow 5s ease-in-out infinite',
                // 'backwards' fill-mode: hidden during stagger delay, but releases
                // transform/opacity afterwards so hover transitions keep working.
                rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
                'fade-in': 'fade-in 0.6s ease-out backwards',
                'scale-in': 'scale-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards',
            },
        },
    },

    plugins: [forms],
};
