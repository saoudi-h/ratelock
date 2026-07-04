import type { BenchMetrics } from '../types'

export function printTable(title: string, metrics: BenchMetrics[]): void {
    console.log(`\n  ■ ${title.toUpperCase()}`)
    console.log(`  ` + `─`.repeat(110))
    console.log(
        `  ${'Implementation'.padEnd(38)} | ${'Ops/sec'.padStart(10)} | ${'Allowed'.padStart(8)} | ${'Rate Limit %'.padStart(12)} | ${'Avg Lat'.padStart(10)} | ${'p95 Lat'.padStart(10)} | ${'p99 Lat'.padStart(10)}`
    )
    console.log(`  ` + `─`.repeat(110))
    for (const m of metrics) {
        console.log(
            `  ${m.name.padEnd(38)} | ${m.throughput.toLocaleString().padStart(10)} | ${m.allowedCount.toLocaleString().padStart(8)} | ${(m.successRate.toFixed(3) + '%').padStart(12)} | ${m.latAvg.toFixed(2).padStart(8)}ms | ${m.latP95.toFixed(2).padStart(8)}ms | ${m.latP99.toFixed(2).padStart(8)}ms`
        )
    }
    console.log(`  ` + `─`.repeat(110))
}
