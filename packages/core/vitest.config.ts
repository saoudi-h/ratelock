import { base } from '@ratelock/vitest'
import type { ViteUserConfig } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
    ...base,
})

export default config
