import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { BenchmarkSuite } from '../types'

export function saveRawJson(reports: Record<string, any[]>, outDir: string): void {
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
    }
    writeFileSync(join(outDir, 'benchmarks_raw.json'), JSON.stringify(reports, null, 2))
}

export function reportJson(suite: BenchmarkSuite, outDir: string): void {
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
    }
    const file = join(outDir, `benchmark-${Date.now()}.json`)
    writeFileSync(file, JSON.stringify(suite, null, 2))
    console.log(`  Results saved to ${file}`)
}
