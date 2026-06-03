import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        reporters: ['default'],
        mockReset: true,
        restoreMocks: true,
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
})
