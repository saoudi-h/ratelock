import { writeFileSync } from 'fs'
import { join } from 'path'
import type { BenchmarkResult, BenchmarkSuite } from '../types'

export function reportConsole(result: BenchmarkResult): void {
    const l = result.latencyMs
    console.log()
    console.log(`  ${result.scenario}`)
    console.log(`  ${'─'.repeat(50)}`)
    console.log(`  Throughput:  ${result.throughput.toLocaleString()} ops/sec`)
    console.log(
        `  Requests:    ${result.totalRequests.toLocaleString()} total, ${result.successes.toLocaleString()} ok, ${result.failures.toLocaleString()} fail`
    )
    console.log(
        `  Latency:     p50=${fmt(l.p50)} p95=${fmt(l.p95)} p99=${fmt(l.p99)} avg=${fmt(l.avg)}`
    )
    console.log(
        `  Memory:      ${result.memory.heapUsedMb} MB delta, ${result.memory.heapTotalMb} MB total`
    )
    if (result.error) console.log(`  Error:       ${result.error}`)
    console.log()
}

export function reportJson(suite: BenchmarkSuite, outDir: string): void {
    const file = join(outDir, `benchmark-${Date.now()}.json`)
    writeFileSync(file, JSON.stringify(suite, null, 2))
    console.log(`  Results saved to ${file}`)
}

function fmt(n: number): string {
    return n < 1 ? `${(n * 1000).toFixed(1)}μs` : `${n.toFixed(2)}ms`
}
