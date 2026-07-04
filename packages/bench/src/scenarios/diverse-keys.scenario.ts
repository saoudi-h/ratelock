import type { BenchmarkScenario } from './types'

export class DiverseKeysScenario implements BenchmarkScenario {
    name = 'Diverse'
    generateKey(keySuffix: string, idCounter: number): string {
        return `bench:key:div:${keySuffix}:${idCounter}`
    }
}
