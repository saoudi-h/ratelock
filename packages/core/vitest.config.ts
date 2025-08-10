import { defineConfig } from 'vitest/config'
import type { ViteUserConfig } from 'vitest/config'
import { base } from '@ratelock/vitest'

const config:ViteUserConfig = defineConfig({
    ...base,
})

export default config

