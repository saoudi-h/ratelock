#!/usr/bin/env node
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { config } from './config'
import { runMatrix1, runMatrix2, runMatrix3, runMatrix4, runMatrix5, runMatrix6 } from './matrices'
import { printTable, saveMarkdownReport, saveRawJson } from './reporters'
import { runHarness } from './runner'
import type { BenchMetrics } from './types'

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
const runtimeName: 'node' | 'bun' = isBun ? 'bun' : 'node'
const runtimeVersion = isBun
    ? (globalThis as unknown as { Bun: { version: string } }).Bun.version
    : process.version
const runtimeLabel = isBun ? `Bun ${runtimeVersion}` : `Node.js ${runtimeVersion}`

// For legacy runner backward-compatibility
import { reportConsole, reportJson } from './reporters'
import { Runner } from './runner'
import { createScenarioChecker } from './scenarios'
import type { Backend, BenchmarkSuite, ScenarioConfig, Strategy } from './types'

const OUT_DIR = process.env.BENCH_OUT ?? join(process.cwd(), 'results')

async function runLegacy() {
    const BACKENDS: Backend[] = ['local']
    const STRATEGIES: Strategy[] = [
        'fixed-window',
        'sliding-window',
        'token-bucket',
        'individual-fixed-window',
    ]
    const DURATION_MS = config.benchDuration
    const CONCURRENCY = config.benchConcurrency
    const LIMIT = config.limit
    const WINDOW_MS = config.windowMs

    const getBackends = (): Backend[] => {
        const raw = process.env.BENCH_BACKENDS
        if (!raw) return BACKENDS
        return raw.split(',').map(s => s.trim()) as Backend[]
    }

    const getStrategies = (): Strategy[] => {
        const raw = process.env.BENCH_STRATEGIES
        if (!raw) return STRATEGIES
        return raw.split(',').map(s => s.trim()) as Strategy[]
    }

    const backends = getBackends()
    const strategies = getStrategies()

    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

    const suite: BenchmarkSuite = {
        meta: {
            date: new Date().toISOString(),
            node: process.version,
            runtime: runtimeName,
            runtimeVersion,
            platform: process.platform,
            arch: process.arch,
        },
        results: [],
    }

    const runner = new Runner()

    console.log()
    console.log(`  ╔══════════════════════════════════════════╗`)
    console.log(`  ║       RateLock Benchmark Suite          ║`)
    console.log(`  ╚══════════════════════════════════════════╝`)
    console.log()
    console.log(`  Duration:    ${DURATION_MS}ms`)
    console.log(`  Concurrency: ${CONCURRENCY}`)
    console.log(`  Limit:       ${LIMIT}`)
    console.log(`  Window:      ${WINDOW_MS}ms`)
    console.log()

    for (const backend of backends) {
        for (const strategy of strategies) {
            const name = `${backend}/${strategy}`

            const scenarioConfig: ScenarioConfig = {
                name,
                backend,
                strategy,
                concurrency: CONCURRENCY,
                durationMs: DURATION_MS,
                limit: LIMIT,
                windowMs: WINDOW_MS,
            }

            try {
                process.stdout.write(`  Running ${name}... `)
                const check = await createScenarioChecker(scenarioConfig)
                const result = await runner.runScenario(check, scenarioConfig)
                suite.results.push(result)
                process.stdout.write('done\n')
                reportConsole(result)
            } catch (err: any) {
                process.stdout.write(`SKIPPED (${err.message})\n\n`)
                suite.results.push({
                    scenario: name,
                    backend,
                    strategy,
                    concurrency: CONCURRENCY,
                    durationMs: DURATION_MS,
                    config: { limit: LIMIT, windowMs: WINDOW_MS, cache: false },
                    totalRequests: 0,
                    successes: 0,
                    failures: 0,
                    throughput: 0,
                    throughputUnit: 'ops/sec',
                    latencyMs: { min: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0 },
                    memory: { heapUsedMb: 0, heapTotalMb: 0 },
                    error: err.message,
                })
            }
        }
    }

    reportJson(suite, OUT_DIR)

    console.log(
        `  Done. ${suite.results.filter(r => !r.error).length}/${suite.results.length} scenarios completed.`
    )
    console.log()
}

async function runFullSuite() {
    console.log(`\n  ==============================================================`)
    console.log(`         RateLock High-Fidelity Standardized Benchmarks`)
    console.log(`  ==============================================================`)
    console.log(`  Duration:    ${config.benchDuration}ms per scenario`)
    console.log(`  Concurrency: ${config.benchConcurrency} workers`)
    console.log(`  Limit:       ${config.limit} requests per window`)
    console.log(`  Window:      ${config.windowMs}ms`)
    console.log(
        `  Latency Sim: ${config.benchLatencyMs > 0 ? config.benchLatencyMs + 'ms simulated delay' : 'disabled'}`
    )
    console.log(`  Environment: ${runtimeLabel} on ${process.platform}/${process.arch}`)
    console.log(`  ==============================================================\n`)

    const reports: Record<string, BenchMetrics[]> = {}

    // Run Matrix 1
    const m1 = await runMatrix1(runHarness)
    printTable('Local Memory Strategy & Scenario Comparison', m1)
    reports['local-algorithms'] = m1

    // Run Matrix 2
    const m2 = await runMatrix2(runHarness)
    if (m2.length > 0) {
        printTable('Redis Strategy & Scenario Comparison', m2)
        reports['redis-strategies'] = m2
    }

    // Run Matrix 3
    const m3 = await runMatrix3(runHarness)
    if (m3.length > 0) {
        printTable('Postgres Strategy & Scenario Comparison', m3)
        reports['postgres-strategies'] = m3
    }

    // Run Matrix 4
    const m4 = await runMatrix4(runHarness)
    if (m4.length > 0) {
        printTable('RateLock vs rate-limiter-flexible Baseline Comparison', m4)
        reports['package-comparison'] = m4
    }

    // Run Matrix 5
    const m5 = await runMatrix5(runHarness)
    if (m5.length > 0) {
        printTable('Driver & Engine Battle Comparison', m5)
        reports['driver-engine-battle'] = m5
    }

    // Run Matrix 6
    const m6 = await runMatrix6(runHarness)
    printTable('Decorator Performance & Resilience Influence', m6)
    reports['decorator-influence'] = m6

    // Write reports
    saveRawJson(reports, OUT_DIR)
    saveMarkdownReport(reports, OUT_DIR)

    console.log(`\n  ==============================================================`)
    console.log(`  Benchmark Suite Completed Successfully!`)
    console.log(`  Raw metrics saved to:      results/benchmarks_raw.json`)
    console.log(`  Detailed Markdown Report:  results/benchmark_report.md`)
    console.log(`  ==============================================================\n`)
}

async function main() {
    const args = process.argv.slice(2)
    const isLegacy =
        args.includes('--legacy') || args.includes('--local') || process.env.BENCH_LEGACY === 'true'

    if (isLegacy) {
        await runLegacy()
        return
    }

    // Support running specific matrix: --matrix <1-6>
    const matrixIdx = args.indexOf('--matrix')
    if (matrixIdx !== -1 && args[matrixIdx + 1]) {
        const num = parseInt(args[matrixIdx + 1]!, 10)
        console.log(`Running Matrix ${num} specifically...`)
        const reports: Record<string, BenchMetrics[]> = {}
        let metrics: BenchMetrics[] = []
        let title = ''
        let key = ''

        switch (num) {
            case 1:
                metrics = await runMatrix1(runHarness)
                title = 'Local Memory Strategy & Scenario Comparison'
                key = 'local-algorithms'
                break
            case 2:
                metrics = await runMatrix2(runHarness)
                title = 'Redis Strategy & Scenario Comparison'
                key = 'redis-strategies'
                break
            case 3:
                metrics = await runMatrix3(runHarness)
                title = 'Postgres Strategy & Scenario Comparison'
                key = 'postgres-strategies'
                break
            case 4:
                metrics = await runMatrix4(runHarness)
                title = 'RateLock vs rate-limiter-flexible Baseline Comparison'
                key = 'package-comparison'
                break
            case 5:
                metrics = await runMatrix5(runHarness)
                title = 'Driver & Engine Battle Comparison'
                key = 'driver-engine-battle'
                break
            case 6:
                metrics = await runMatrix6(runHarness)
                title = 'Decorator Performance & Resilience Influence'
                key = 'decorator-influence'
                break
            default:
                console.error(`Invalid matrix number: ${num}`)
                process.exit(1)
        }

        if (metrics.length > 0) {
            printTable(title, metrics)
            reports[key] = metrics
            saveRawJson(reports, OUT_DIR)
            saveMarkdownReport(reports, OUT_DIR)
        }
        return
    }

    await runFullSuite()
}

main().catch(console.error)
