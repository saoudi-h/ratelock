#!/usr/bin/env node
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { reportConsole, reportJson } from './reporters'
import { Runner } from './runner'
import { createScenarioChecker } from './scenarios'
import type { Backend, BenchmarkSuite, ScenarioConfig, Strategy } from './types'

const BACKENDS: Backend[] = ['local']
const STRATEGIES: Strategy[] = [
    'fixed-window',
    'sliding-window',
    'token-bucket',
    'individual-fixed-window',
]
const DURATION_MS = parseInt(process.env.BENCH_DURATION ?? '3000', 10)
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY ?? '10', 10)
const LIMIT = parseInt(process.env.BENCH_LIMIT ?? '10000', 10)
const WINDOW_MS = parseInt(process.env.BENCH_WINDOW_MS ?? '60000', 10)
const OUT_DIR = process.env.BENCH_OUT ?? join(process.cwd(), 'results')

async function main() {
    const backends = getBackends()
    const strategies = getStrategies()

    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

    const suite: BenchmarkSuite = {
        meta: {
            date: new Date().toISOString(),
            node: process.version,
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

            const config: ScenarioConfig = {
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
                const check = await createScenarioChecker(config)
                const result = await runner.runScenario(check, config)
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

function getBackends(): Backend[] {
    const raw = process.env.BENCH_BACKENDS
    if (!raw) return BACKENDS
    return raw.split(',').map(s => s.trim()) as Backend[]
}

function getStrategies(): Strategy[] {
    const raw = process.env.BENCH_STRATEGIES
    if (!raw) return STRATEGIES
    return raw.split(',').map(s => s.trim()) as Strategy[]
}

main().catch(console.error)
