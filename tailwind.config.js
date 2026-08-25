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
            },
            animation: {
                'float-slow': 'float-slow 5s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
