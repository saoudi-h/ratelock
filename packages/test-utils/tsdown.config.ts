import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const configFn: UserConfigFn = defineConfig(async ({ watch }) => ({
    entry: ['./src/**/*.ts'],
    platform: 'node',
    unused: {
        level: 'error',
        ignore: ['typescript'],
    },
    format: ['esm', 'cjs'],
    publint: true,
    exports: true,
    fixedExtension: true,
    unbundle: false,
    onSuccess() {
        console.info('🙏 Build succeeded!')
    },
    clean: true,
    minify: false,
    external: ['vitest'],
    dts: true,
    sourcemap: true,
    treeshake: false,
}))

export default configFn
