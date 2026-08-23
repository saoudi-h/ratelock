import { defineConfig } from 'vitest/config'

export default defineConfig({
    esbuild: {
        // NestJS packages compile with legacy decorators; some vitest/esbuild
        // combinations ignore the tsconfig flag, so pin it explicitly.
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true,
            },
        },
    },
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        reporters: ['default'],
        mockReset: true,
        restoreMocks: true,
    },
})
