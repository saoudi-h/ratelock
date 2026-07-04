import type { BenchmarkScenario } from './types'

export class BatchCheckScenario implements BenchmarkScenario {
    name = 'Batch'
    generateKey(keySuffix: string, idCounter: number): string[] {
        const baseCounter = idCounter * 5
        return Array.from(
            { length: 5 },
            (_, i) => `bench:key:batch:${keySuffix}:${baseCounter + i}-${i}`
        )
    }
}
