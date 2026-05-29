import type { BenchmarkScenario } from './types'

export class RealisticMixScenario implements BenchmarkScenario {
    name = 'Realistic Mix'
    generateKey(keySuffix: string, idCounter: number): string {
        const isSpam = Math.random() < 0.3
        return isSpam
            ? `bench:key:spam-realistic:${keySuffix}`
            : `bench:key:unique:${keySuffix}:${idCounter}`
    }
}
