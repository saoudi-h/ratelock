import { base } from '@tala-tools/eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...base,
    {
        ignores: [
            'eslint.config.js',
            'eslint-types.d.ts',
            'prettier.config.js',
            'tests',
            'coverage',
            'lint-staged.config.mjs',
            'vitest.config.ts',
        ],
    },
])
