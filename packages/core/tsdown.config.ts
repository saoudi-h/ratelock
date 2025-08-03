import { base } from '@ratelock/tsdown'
import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfigFn = defineConfig(async (options) => ({
    ... await base(options),
    entry: ['./src/index.ts', './src/{limiter,storage,strategy}/index.ts'],
}))

export default config
