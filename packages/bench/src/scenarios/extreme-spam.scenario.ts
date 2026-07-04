import type { BenchmarkScenario } from './types'

export class ExtremeSpamScenario implements BenchmarkScenario {
    name = 'Extreme Spam'
    generateKey(keySuffix: string): string {
        return `bench:key:extreme-spam-target:${keySuffix}`
    }
}
