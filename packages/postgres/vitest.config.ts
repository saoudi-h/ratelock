import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        reporters: ['default'],
        mockReset: true,
        restoreMocks: true,
        exclude: ['**/__integration__/**', '**/node_modules/**', '**/dist/**'],
    },
})
