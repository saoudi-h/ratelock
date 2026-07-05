import { base } from '@tala-tools/eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...base,
    {
        ignores: [
            'eslint.config.ts',
            'prettier.config.js',
            'lint-staged.config.mjs',
            'vitest.config.ts',
            'vitest.integration.config.ts',
            'coverage',
        ],
    },
])
