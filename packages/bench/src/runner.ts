import { performance } from 'perf_hooks'
import type { BenchmarkAdapter } from './adapters/types'
import { config } from './config'
import type { BenchmarkScenario } from './scenarios/types'
import type { BenchmarkResult, BenchMetrics, ScenarioConfig } from './types'

export async function runHarness(
    adapter: BenchmarkAdapter,
    scenario: BenchmarkScenario
): Promise<BenchMetrics> {
    const latencies: number[] = []
    let successes = 0
    let totalReqs = 0

    const start = performance.now()
    const endAt = start + config.benchDuration
    const workers: Promise<void>[] = []
    let idCounter = 0

    const keySuffix = adapter.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()

    const isLocal =
        adapter.name.toLowerCase().includes('local') ||
        adapter.name.toLowerCase().includes('memory') ||
        adapter.name.toLowerCase().includes('raw') ||
        adapter.name.toLowerCase().includes('cache') ||
        adapter.name.toLowerCase().includes('fallback') ||
        adapter.name.toLowerCase().includes('retry') ||
        adapter.name.toLowerCase().includes('circuitbreaker') ||
        adapter.name.toLowerCase().includes('decorator')
    const shouldApplyLatency = !isLocal && config.benchLatencyMs > 0

    const work = async () => {
        while (performance.now() < endAt) {
            const idOrIds = scenario.generateKey(keySuffix, idCounter++)

            const t0 = performance.now()
            try {
                if (shouldApplyLatency) {
                    await new Promise(r => setTimeout(r, config.benchLatencyMs))
                }
                const res = await adapter.check(idOrIds)
                const elapsed = performance.now() - t0
                latencies.push(elapsed)

                if (res.allowed) {
                    successes++
                }
            } catch {
                // Ignore errors
            }
            totalReqs++
        }
    }

    // Spawn concurrent workers
    for (let w = 0; w < config.benchConcurrency; w++) {
        workers.push(work())
    }

    await Promise.all(workers)
    const elapsed = performance.now() - start

    // Sort for percentiles
    const sorted = latencies.slice().sort((a, b) => a - b)
    const p = (pct: number) => {
        if (sorted.length === 0) return 0
        const idx = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1)
        return sorted[idx]!
    }

    const throughput = Math.round((totalReqs / elapsed) * 1000)
    const successRate = totalReqs > 0 ? (successes / totalReqs) * 100 : 0
    const latAvg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0

    return {
        name: `${adapter.name} (${scenario.name})`,
        throughput,
        successRate,
        allowedCount: successes,
        latAvg,
        latP50: p(50),
        latP95: p(95),
        latP99: p(99),
        totalReqs,
    }
}

export class Runner {
    async runScenario(
        check: (id: string) => Promise<unknown>,
        scenarioConfig: ScenarioConfig
    ): Promise<BenchmarkResult> {
        const latencies: number[] = []
        let successes = 0
        let failures = 0

        const memoryBefore = process.memoryUsage()

        const start = performance.now()
        const endAt = start + scenarioConfig.durationMs

        const workers: Promise<void>[] = []
        let counter = 0

        const work = async () => {
            while (performance.now() < endAt) {
                const id = `bench:${scenarioConfig.strategy}:${counter++}`
                const t0 = performance.now()
                try {
                    await check(id)
                    const elapsed = performance.now() - t0
                    latencies.push(elapsed)
                    successes++
                } catch {
                    failures++
                }
            }
        }

        for (let i = 0; i < scenarioConfig.concurrency; i++) {
            workers.push(work())
        }

        await Promise.all(workers)

        const elapsed = performance.now() - start
        const memoryAfter = process.memoryUsage()

        const sorted = latencies.slice().sort((a, b) => a - b)

        return {
            scenario: scenarioConfig.name,
            backend: scenarioConfig.backend,
            strategy: scenarioConfig.strategy,
            concurrency: scenarioConfig.concurrency,
            durationMs: scenarioConfig.durationMs,
            config: {
                limit: scenarioConfig.limit,
                windowMs: scenarioConfig.windowMs,
                cache: !!scenarioConfig.cache,
            },
            totalRequests: successes + failures,
            successes,
            failures,
            throughput: Math.round((successes / elapsed) * 1000),
            throughputUnit: 'ops/sec',
            latencyMs: {
                min: sorted[0] ?? 0,
                p50: percentile(sorted, 50),
                p95: percentile(sorted, 95),
                p99: percentile(sorted, 99),
                max: sorted[sorted.length - 1] ?? 0,
                avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
            },
            memory: {
                heapUsedMb: Math.round(
                    (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024
                ),
                heapTotalMb: Math.round(memoryAfter.heapTotal / 1024 / 1024),
            },
        }
    }
}

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const i = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))
    return sorted[i]!
}
