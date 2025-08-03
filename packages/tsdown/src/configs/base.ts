import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

export const base: UserConfigFn = defineConfig(({ watch }) => ({
    entry: ['./src/**/*.ts'],
    platform: 'node',
    dts: {
        sourcemap: !!watch,
        compilerOptions: {
            isolatedDeclarations: true,
        },
    },
    unused: {
        level: 'error',
        ignore: ['typescript'],
    },
    format: ['esm', 'cjs'],
    publint: true,
    exports: true,
    fixedExtension: true,
    minify: true,
    unbundle: true,
    onSuccess() {
        console.info('🙏 Build succeeded!')
    },
    clean: true,
}))
