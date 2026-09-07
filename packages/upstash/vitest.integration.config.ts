import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        include: ['**/__integration__/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
})
