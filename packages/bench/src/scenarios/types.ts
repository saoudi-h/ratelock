export interface BenchmarkScenario {
    name: string
    generateKey(keySuffix: string, idCounter: number): string | string[]
}
