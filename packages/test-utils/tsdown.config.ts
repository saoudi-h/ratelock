import { base } from '@ratelock/tsdown'
import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const configFn: UserConfigFn = defineConfig(async options => ({
    ...(await base(options)),
    entry: ['./src/**/*.ts'],
    minify: false,
    external: ['vitest'],
    dts: true,
    sourcemap: true,
    treeshake: false
}))

export default configFn
