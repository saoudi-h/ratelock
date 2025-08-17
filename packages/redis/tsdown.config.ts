import { base } from '@ratelock/tsdown'
import type { UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const configFn: UserConfigFn = defineConfig(async options => ({
    ...(await base(options)),
    entry: ['./src/index.ts', './src/{factory,storage,strategy}/index.ts'],
}))

export default configFn
