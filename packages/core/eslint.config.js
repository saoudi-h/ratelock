import { configs, defineConfig } from '@ratelock/eslint'

export default defineConfig(...configs.base, {
    ignores: [
        'eslint.config.js',
        'eslint-types.d.ts',
        'prettier.config.js',
        'coverage',
        'examples',
    ],
})
