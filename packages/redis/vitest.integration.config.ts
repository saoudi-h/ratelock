import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config({ path: '.env.test' })

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        reporters: ['default'],
        mockReset: true,
        restoreMocks: true,
        include: ['__integration__/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
    },
})
