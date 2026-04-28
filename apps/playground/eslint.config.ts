import { next } from '@tala-tools/eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...next,
    {
        ignores: [
            'eslint.config.ts',
            'eslint-types.d.ts',
            'prettier.config.js',
            'lint-staged.config.mjs',
        ],
    },
    {
        settings: {
            'better-tailwindcss': {
                entryPoint: './src/app/globals.css',
            },
        },
    },
    {
        rules: {
            'better-tailwindcss/no-unknown-classes': [
                'error',
                {
                    ignore: [],
                },
            ],
        },
    },
])
