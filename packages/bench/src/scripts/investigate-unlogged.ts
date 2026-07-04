/**
 * Focused investigation: how much overhead does WAL actually add?
 *
 * Compares pg-Logged vs pg-Unlogged Fixed Window under the current bench
 * harness (no latency injection, full pool parallelism) and reports
 * throughput across multiple runs plus summary statistics.
 *
 * Usage:
 *   pnpm tsx src/scripts/investigate-unlogged.ts [--runs=N] [--duration=MS] [--concurrency=N]
 */
import { PostgresAdapter } from '../adapters'
import { config as benchConfig } from '../config'
import { runHarness } from '../runner'
import { DiverseKeysScenario } from '../scenarios'
import type { BenchMetrics } from '../types'

const args = process.argv.slice(2)
function arg(name: string, fallback: number): number {
    const found = args.find(a => a.startsWith(`--${name}=`))
    if (!found) return fallback
    return parseInt(found.split('=')[1] ?? '', 10) || fallback
}

const runs = arg('runs', benchConfig.benchRuns)
const durationMs = arg('duration', benchConfig.benchDuration)
const concurrency = arg('concurrency', benchConfig.benchConcurrency)

const scenario = new DiverseKeysScenario()

async function benchOne(name: string, unlogged: boolean): Promise<BenchMetrics> {
    const adapter = new PostgresAdapter({
        name,
        strategy: 'fixed-window',
        driverType: 'pg',
        unlogged,
        skipMigrations: false,
    })
    try {
        await adapter.initialize()
        return await runHarness(adapter, scenario)
    } finally {
        await adapter.destroy()
    }
}

function fmtRow(label: string, m: BenchMetrics): string {
    const tput = m.throughput.toString().padStart(7)
    const p50 = m.latP50.toFixed(2).padStart(7)
    const p95 = m.latP95.toFixed(2).padStart(7)
    const p99 = m.latP99.toFixed(2).padStart(7)
    const tputMin = m.throughputMin.toString().padStart(6)
    const tputMax = m.throughputMax.toString().padStart(6)
    const tputStd = m.throughputStdev.toString().padStart(5)
    return `  ${label.padEnd(45)} ${tput} ops/s  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms  (min=${tputMin} max=${tputMax} σ=${tputStd})`
}

async function main() {
    console.log(`\n=== Unlogged vs Logged investigation ===`)
    console.log(
        `  runs=${runs}  duration=${durationMs}ms  concurrency=${concurrency}  limit=${benchConfig.limit}  window=${benchConfig.windowMs}ms`
    )
    console.log(`  pgUrl=${benchConfig.postgresUrl}`)

    const samples: { logged: BenchMetrics; unlogged: BenchMetrics; ratio: number }[] = []

    for (let i = 0; i < runs; i++) {
        const runLabel = `Run ${i + 1}/${runs}`
        console.log(`\n${runLabel}`)
        const logged = await benchOne(`pg-Logged-FW #${i + 1}`, false)
        console.log(fmtRow(`pg-Logged-FW #${i + 1}`, logged))
        const unlogged = await benchOne(`pg-Unlogged-FW #${i + 1}`, true)
        console.log(fmtRow(`pg-Unlogged-FW #${i + 1}`, unlogged))
        const ratio = unlogged.throughput / Math.max(1, logged.throughput)
        samples.push({ logged, unlogged, ratio })
        const deltaPct = ((ratio - 1) * 100).toFixed(1)
        console.log(`  unlogged/logged ratio: ${ratio.toFixed(3)} (${deltaPct}% faster)`)
    }

    const ratios = samples.map(s => s.ratio)
    const loggedAvg = samples.reduce((a, s) => a + s.logged.throughput, 0) / samples.length
    const unloggedAvg = samples.reduce((a, s) => a + s.unlogged.throughput, 0) / samples.length
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length
    const min = Math.min(...ratios)
    const max = Math.max(...ratios)

    console.log(`\n=== Summary across ${runs} runs ===`)
    console.log(
        `  pg-Logged    avg throughput: ${Math.round(loggedAvg).toString().padStart(7)} ops/s`
    )
    console.log(
        `  pg-Unlogged  avg throughput: ${Math.round(unloggedAvg).toString().padStart(7)} ops/s`
    )
    console.log(
        `  ratio unlogged/logged:       ${mean.toFixed(3)} mean  min=${min.toFixed(3)}  max=${max.toFixed(3)}`
    )
    console.log(
        `  overhead of WAL:             ${((mean - 1) * 100 * -1).toFixed(1)}% (positive = WAL is slower)`
    )
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('investigation failed:', err)
        process.exit(1)
    })
