import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfigFn = defineConfig(async ({ watch }) => ({
    entry: ['./src/index.ts'],
    platform: 'neutral',
    dts: { sourcemap: !!watch },
    unused: { level: 'error', ignore: ['typescript', '@upstash/redis'] },
    format: ['esm', 'cjs'],
    deps: { alwaysBundle: ['@ratelock/redis-common'] },
    publint: true,
    exports: true,
    fixedExtension: true,
    minify: true,
    unbundle: false,
    onSuccess() {
        console.info('Build succeeded!')
    },
    clean: true,
}))

export default config
