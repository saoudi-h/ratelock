#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

import { UpstashAdapter, type UpstashStrategy } from './adapters'
import { config } from './config'
import { runHarness } from './runner'
import {
    BatchCheckScenario,
    DiverseKeysScenario,
    ExtremeSpamScenario,
    RealisticMixScenario,
} from './scenarios'
import type { BenchmarkScenario } from './scenarios/types'
import type { BenchMetrics } from './types'

type BenchmarkMode = 'local' | 'remote'

type TransportSnapshot = {
    httpRequests: number
    fetchErrors: number
    statusCounts: Record<string, number>
}

type RequestStats = TransportSnapshot

type ScenarioId = 'diverse' | 'spam' | 'realistic' | 'batch'

type ScenarioDefinition = {
    id: ScenarioId
    label: string
    batchSize: number
    create: () => BenchmarkScenario
}

type UpstashRunConfig = {
    mode: BenchmarkMode
    durationMs: number
    concurrency: number
    runs: number
    warmupMs: number
    limit: number
    windowMs: number
}

type ColdProbe = TransportSnapshot & {
    latencyMs: number
    error?: string
}

type UpstashBenchmarkResult = {
    strategy: UpstashStrategy
    scenario: ScenarioId
    scenarioLabel: string
    batchSize: number
    metrics?: BenchMetrics
    coldProbe?: ColdProbe
    warmTransport?: TransportSnapshot & {
        httpRequestsPerOperation: number
        httpRequestsPerIdentifier: number
    }
    error?: string
}

type UpstashBenchmarkReport = {
    meta: {
        generatedAt: string
        mode: BenchmarkMode
        endpointHost: string
        runtime: string
        platform: string
        arch: string
        config: UpstashRunConfig
        strategies: UpstashStrategy[]
        scenarios: ScenarioId[]
    }
    results: UpstashBenchmarkResult[]
}

const STRATEGIES: readonly UpstashStrategy[] = [
    'fixed-window',
    'sliding-window',
    'token-bucket',
    'individual-fixed-window',
]

const SCENARIOS: readonly ScenarioDefinition[] = [
    { id: 'diverse', label: 'Diverse Keys', batchSize: 1, create: () => new DiverseKeysScenario() },
    { id: 'spam', label: 'Extreme Spam', batchSize: 1, create: () => new ExtremeSpamScenario() },
    {
        id: 'realistic',
        label: 'Realistic Mix',
        batchSize: 1,
        create: () => new RealisticMixScenario(),
    },
    { id: 'batch', label: 'Batch Check (5)', batchSize: 5, create: () => new BatchCheckScenario() },
]

function createRequestStats(): RequestStats {
    return { httpRequests: 0, fetchErrors: 0, statusCounts: {} }
}

function resetRequestStats(stats: RequestStats): void {
    stats.httpRequests = 0
    stats.fetchErrors = 0
    stats.statusCounts = {}
}

function snapshotRequestStats(stats: RequestStats): TransportSnapshot {
    return {
        httpRequests: stats.httpRequests,
        fetchErrors: stats.fetchErrors,
        statusCounts: { ...stats.statusCounts },
    }
}

function installFetchCounter(stats: RequestStats): () => void {
    const originalFetch = globalThis.fetch
    if (typeof originalFetch !== 'function') {
        throw new Error('The Upstash benchmark requires a runtime-provided fetch implementation')
    }

    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
        stats.httpRequests++

        try {
            const response = await originalFetch(...args)
            const status = String(response.status)
            stats.statusCounts[status] = (stats.statusCounts[status] ?? 0) + 1
            return response
        } catch (error) {
            stats.fetchErrors++
            throw error
        }
    }) as typeof fetch

    return () => {
        globalThis.fetch = originalFetch
    }
}

function parseMode(): BenchmarkMode {
    const mode = process.env.BENCH_UPSTASH_MODE ?? 'local'
    if (mode !== 'local' && mode !== 'remote') {
        throw new Error(`BENCH_UPSTASH_MODE must be "local" or "remote", received "${mode}"`)
    }
    return mode
}

function parseInteger(name: string, fallback: number, options: { min: number }): number {
    const raw = process.env[name]
    if (raw === undefined) return fallback

    const value = Number(raw)
    if (!Number.isInteger(value) || value < options.min) {
        throw new Error(`${name} must be an integer >= ${options.min}, received "${raw}"`)
    }
    return value
}

function parseSelection<T extends string>(
    name: string,
    fallback: readonly T[],
    allowed: readonly T[]
): T[] {
    const raw = process.env[name]
    const values = raw
        ? raw
              .split(',')
              .map(value => value.trim())
              .filter(Boolean)
        : [...fallback]

    const invalid = values.filter(value => !allowed.includes(value as T))
    if (invalid.length > 0) {
        throw new Error(`${name} contains unsupported value(s): ${invalid.join(', ')}`)
    }
    if (values.length === 0) throw new Error(`${name} must contain at least one value`)

    return [...new Set(values)] as T[]
}

function getRunConfig(mode: BenchmarkMode): UpstashRunConfig {
    const isRemote = mode === 'remote'
    const defaults = isRemote
        ? { durationMs: 500, concurrency: 4, runs: 1, warmupMs: 100 }
        : {
              durationMs: config.benchDuration,
              concurrency: config.benchConcurrency,
              runs: config.benchRuns,
              warmupMs: config.benchWarmupMs,
          }

    return {
        mode,
        durationMs: parseInteger('BENCH_UPSTASH_DURATION', defaults.durationMs, { min: 1 }),
        concurrency: parseInteger('BENCH_UPSTASH_CONCURRENCY', defaults.concurrency, { min: 1 }),
        runs: parseInteger('BENCH_UPSTASH_RUNS', defaults.runs, { min: 1 }),
        warmupMs: parseInteger('BENCH_UPSTASH_WARMUP_MS', defaults.warmupMs, { min: 0 }),
        limit: config.limit,
        windowMs: config.windowMs,
    }
}

function getEndpointHost(): string {
    const url = process.env.UPSTASH_REDIS_REST_URL
    if (!url) throw new Error('Set UPSTASH_REDIS_REST_URL before running the Upstash benchmark')
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Set UPSTASH_REDIS_REST_TOKEN before running the Upstash benchmark')
    }

    try {
        return new URL(url).host
    } catch {
        throw new Error(`UPSTASH_REDIS_REST_URL is not a valid URL: "${url}"`)
    }
}

function applyHarnessConfig(runConfig: UpstashRunConfig): () => void {
    const previous = {
        benchDuration: config.benchDuration,
        benchConcurrency: config.benchConcurrency,
        benchRuns: config.benchRuns,
        benchWarmupMs: config.benchWarmupMs,
        benchLatencyMs: config.benchLatencyMs,
    }

    config.benchDuration = runConfig.durationMs
    config.benchConcurrency = runConfig.concurrency
    config.benchRuns = runConfig.runs
    config.benchWarmupMs = runConfig.warmupMs
    config.benchLatencyMs = 0

    return () => {
        config.benchDuration = previous.benchDuration
        config.benchConcurrency = previous.benchConcurrency
        config.benchRuns = previous.benchRuns
        config.benchWarmupMs = previous.benchWarmupMs
        config.benchLatencyMs = previous.benchLatencyMs
    }
}

function formatStatuses(statusCounts: Record<string, number>): string {
    const entries = Object.entries(statusCounts).sort(([a], [b]) => Number(a) - Number(b))
    return entries.length > 0
        ? entries.map(([status, count]) => `${status}:${count}`).join(', ')
        : '—'
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

async function measureColdProbe(
    adapter: UpstashAdapter,
    stats: RequestStats,
    key: string
): Promise<ColdProbe> {
    resetRequestStats(stats)
    const startedAt = performance.now()
    let error: string | undefined

    try {
        await adapter.check(key)
    } catch (caught) {
        error = errorMessage(caught)
    }

    return {
        ...snapshotRequestStats(stats),
        latencyMs: performance.now() - startedAt,
        ...(error ? { error } : {}),
    }
}

function buildReportMarkdown(report: UpstashBenchmarkReport): string {
    const { config: runConfig } = report.meta
    let markdown = `# RateLock Upstash HTTP characterization\n\n`
    markdown += `Generated: \`${report.meta.generatedAt}\`  \n`
    markdown += `Mode: **${report.meta.mode}**  \n`
    markdown += `Endpoint host: \`${report.meta.endpointHost}\`  \n`
    markdown += `Runtime: \`${report.meta.runtime}\` on \`${report.meta.platform}/${report.meta.arch}\`\n\n`

    markdown += `## How to read these numbers\n\n`
    markdown += `This is an opt-in HTTP characterization, not an extension of the standard local benchmark tables. `
    markdown += `The local mode sends the official Upstash REST client through the Serverless Redis HTTP bridge and a local Redis container; it does not measure the managed Upstash service. `
    markdown += `The remote mode measures one endpoint from one machine at one point in time. Network path, region, plan, service load, quotas and HTTP throttling can all change the result.\n\n`
    markdown += `The request counters are calls observed by the runtime's global \`fetch\`, not packets on the wire. `
    markdown += `A scalar \`check\` normally maps to one REST request once the Lua script is loaded. `
    markdown += `The Batch scenario calls \`checkBatch\`: five Lua invocations are sent in one REST pipeline request, so its HTTP requests per identifier should be lower than its HTTP requests per benchmark operation.\n\n`

    markdown += `## Configuration\n\n`
    markdown += `- Duration: \`${runConfig.durationMs} ms\` per timed run\n`
    markdown += `- Concurrency: \`${runConfig.concurrency}\` workers\n`
    markdown += `- Runs: \`${runConfig.runs}\`\n`
    markdown += `- Warmup: \`${runConfig.warmupMs} ms\` (excluded from transport counters)\n`
    markdown += `- Limit/window: \`${runConfig.limit}\` requests / \`${runConfig.windowMs} ms\`\n\n`

    markdown += `## Results\n\n`
    markdown += `| Strategy | Scenario | Ops/sec | p50 | p99 | Cold ms | HTTP requests | HTTP/op | HTTP/id | Statuses | Fetch errors |\n`
    markdown += `| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- | ---: |\n`

    for (const result of report.results) {
        if (!result.metrics || !result.coldProbe || !result.warmTransport) {
            markdown += `| ${result.strategy} | ${result.scenarioLabel} | — | — | — | — | — | — | — | — | — |\n`
            continue
        }

        markdown += `| ${result.strategy} | ${result.scenarioLabel} | ${result.metrics.throughput.toLocaleString()} | ${result.metrics.latP50.toFixed(2)} ms | ${result.metrics.latP99.toFixed(2)} ms | ${result.coldProbe.latencyMs.toFixed(2)} ms | ${result.warmTransport.httpRequests.toLocaleString()} | ${result.warmTransport.httpRequestsPerOperation.toFixed(3)} | ${result.warmTransport.httpRequestsPerIdentifier.toFixed(3)} | ${formatStatuses(result.warmTransport.statusCounts)} | ${result.warmTransport.fetchErrors} |\n`
    }

    markdown += `\n## Limits of interpretation\n\n`
    markdown += `- **Cold vs warm:** the cold probe includes the first script-load request; the timed transport counters start after the configured warmup.\n`
    markdown += `- **HTTP status 429:** a non-zero count is a signal to inspect service/request throttling or another upstream policy. It is not silently folded into throughput.\n`
    markdown += `- **No universal ranking:** these values should not be compared directly with the local Redis/Postgres tables or presented as a promise of production latency.\n`
    markdown += `- **Remote runs are not CI:** use the local bridge for reproducible checks; run against a real Upstash database deliberately and with conservative settings.\n`

    return markdown
}

function writeReport(report: UpstashBenchmarkReport): void {
    const outDir = resolve(
        process.env.BENCH_UPSTASH_OUT ?? join(process.cwd(), 'results', 'upstash')
    )
    mkdirSync(outDir, { recursive: true })

    const stamp = report.meta.generatedAt.replace(/[.:]/g, '-')
    const jsonPath = join(outDir, `benchmark-${stamp}.json`)
    const markdownPath = join(outDir, `benchmark-${stamp}.md`)

    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
    writeFileSync(markdownPath, buildReportMarkdown(report))

    console.log(`\n  JSON report:     ${jsonPath}`)
    console.log(`  Markdown report: ${markdownPath}`)
}

function printResult(result: UpstashBenchmarkResult): void {
    if (!result.metrics || !result.coldProbe || !result.warmTransport) {
        console.log(`  ${result.strategy}/${result.scenario}: ${result.error ?? 'skipped'}`)
        return
    }

    const throttled = result.warmTransport.statusCounts['429'] ?? 0
    const warning = throttled > 0 ? ` ⚠ ${throttled} response(s) with HTTP 429` : ''
    console.log(
        `  ${result.strategy}/${result.scenario}: ${result.metrics.throughput.toLocaleString()} ops/s, ` +
            `p50 ${result.metrics.latP50.toFixed(2)} ms, p99 ${result.metrics.latP99.toFixed(2)} ms, ` +
            `${result.warmTransport.httpRequestsPerOperation.toFixed(3)} HTTP request/op, ` +
            `statuses ${formatStatuses(result.warmTransport.statusCounts)}${warning}`
    )
}

async function main(): Promise<void> {
    const mode = parseMode()
    const endpointHost = getEndpointHost()
    const runConfig = getRunConfig(mode)
    const selectedStrategies = parseSelection(
        'BENCH_UPSTASH_STRATEGIES',
        mode === 'remote' ? ['fixed-window'] : STRATEGIES,
        STRATEGIES
    )
    const selectedScenarios = parseSelection(
        'BENCH_UPSTASH_SCENARIOS',
        mode === 'remote' ? ['diverse', 'batch'] : SCENARIOS.map(scenario => scenario.id),
        SCENARIOS.map(scenario => scenario.id)
    )

    const scenarioById = new Map(SCENARIOS.map(scenario => [scenario.id, scenario]))
    const stats = createRequestStats()
    const restoreFetch = installFetchCounter(stats)
    const restoreConfig = applyHarnessConfig(runConfig)
    const results: UpstashBenchmarkResult[] = []
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    console.log(`\n  RateLock Upstash HTTP characterization (${mode})`)
    console.log(`  Endpoint:    ${endpointHost}`)
    console.log(`  Duration:    ${runConfig.durationMs}ms`)
    console.log(`  Concurrency: ${runConfig.concurrency}`)
    console.log(`  Runs:        ${runConfig.runs}`)
    console.log(`  Warmup:      ${runConfig.warmupMs}ms`)
    console.log(`  Strategies:  ${selectedStrategies.join(', ')}`)
    console.log(`  Scenarios:   ${selectedScenarios.join(', ')}\n`)

    try {
        for (const strategy of selectedStrategies) {
            for (const scenarioId of selectedScenarios) {
                const scenario = scenarioById.get(scenarioId)!
                const prefix = `bench:upstash:${runId}:${strategy}:${scenarioId}`
                const adapter = new UpstashAdapter({ strategy, prefix })
                const result: UpstashBenchmarkResult = {
                    strategy,
                    scenario: scenario.id,
                    scenarioLabel: scenario.label,
                    batchSize: scenario.batchSize,
                }

                try {
                    await adapter.initialize()
                    const coldProbe = await measureColdProbe(
                        adapter,
                        stats,
                        `__cold:${runId}:${strategy}:${scenarioId}`
                    )
                    result.coldProbe = coldProbe
                    if (coldProbe.error) {
                        throw new Error(`Cold probe failed: ${coldProbe.error}`)
                    }

                    resetRequestStats(stats)
                    const metrics = await runHarness(adapter, scenario.create(), {
                        afterWarmup: () => resetRequestStats(stats),
                    })
                    const warmTransport = snapshotRequestStats(stats)
                    result.metrics = metrics
                    result.warmTransport = {
                        ...warmTransport,
                        httpRequestsPerOperation:
                            metrics.totalReqs > 0
                                ? warmTransport.httpRequests / metrics.totalReqs
                                : 0,
                        httpRequestsPerIdentifier:
                            metrics.totalReqs > 0
                                ? warmTransport.httpRequests /
                                  (metrics.totalReqs * scenario.batchSize)
                                : 0,
                    }
                } catch (error) {
                    result.error = errorMessage(error)
                    console.error(`  ${strategy}/${scenario.id}: ${result.error}`)
                } finally {
                    await adapter.destroy()
                }

                results.push(result)
                printResult(result)
            }
        }
    } finally {
        restoreConfig()
        restoreFetch()
    }

    const report: UpstashBenchmarkReport = {
        meta: {
            generatedAt: new Date().toISOString(),
            mode,
            endpointHost,
            runtime: `Node.js ${process.version}`,
            platform: process.platform,
            arch: process.arch,
            config: runConfig,
            strategies: selectedStrategies,
            scenarios: selectedScenarios,
        },
        results,
    }

    writeReport(report)

    const failed = results.filter(result => result.error).length
    if (failed > 0) {
        throw new Error(`${failed} Upstash benchmark case(s) failed; see the report for details`)
    }
}

main().catch(error => {
    console.error(`\n  Upstash benchmark failed: ${errorMessage(error)}`)
    process.exitCode = 1
})
