import { next } from '@tala-tools/eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...next,
    {
        ignores: [
            '.next/',
            '.source/',
            'next-env.d.ts',
            'prettier.config.js',
            'postcss.config.mjs',
            'lint-staged.config.mjs',
        ],
    },
    {
        settings: {
            'better-tailwindcss': {
                entryPoint: './src/app/globals.css',
                detectComponentClasses: true,
                ignore: ['toaster', 'data-*', 'cn-*', 'no-scrollbar', 'animate-event-pop', 'animate-token-enter', 'animate-token-exit'],
            },
        },
    },
])
