import viteTsconfigPaths from 'vite-tsconfig-paths'
import type { ViteUserConfig } from 'vitest/config'

export const base: ViteUserConfig = {
    plugins: [viteTsconfigPaths()],
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        reporters: ['default'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            exclude: ['**/dist/**', '**/*.d.ts', '**/node_modules/**'],
        },
        setupFiles: [],
        mockReset: true,
        restoreMocks: true,
        include: ['**/*.spec.ts', '**/*.test.ts'],
    },
}
