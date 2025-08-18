import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'
import { base } from './src/configs/base'

const config: UserConfigFn = defineConfig(async options => ({
    ...(await base(options)),
    entry: ['./src/index.ts', './src/{configs}/index.ts'],
}))

export default config
