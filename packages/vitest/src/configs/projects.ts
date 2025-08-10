import { type ViteUserConfig } from 'vitest/config'
import { base } from '../configs/base'

export const projects: ViteUserConfig = {
    ...base,
    test: {
        projects: ['packages/*/vitest.config.ts'],
    },
}
