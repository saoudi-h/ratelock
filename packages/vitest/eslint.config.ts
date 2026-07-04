import { base } from '@tala-tools/eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    ...base,
    {
        ignores: [
            'eslint.config.ts',
            'eslint-types.d.ts',
            'prettier.config.js',
            'tsdown.config.ts',
            'lint-staged.config.mjs',
        ],
    },
])
