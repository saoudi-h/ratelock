import { configs, defineConfig } from '@ratelock/eslint'

export default defineConfig(...configs.next, {
    ignores: ['eslint.config.js', 'eslint-types.d.ts', 'prettier.config.js','lint-staged.config.mjs'],
})
