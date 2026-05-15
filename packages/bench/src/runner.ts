import { performance } from 'perf_hooks'
import type { BenchmarkResult, ScenarioConfig } from './types'

export class Runner {
  async runScenario(
    check: (id: string) => Promise<unknown>,
    config: ScenarioConfig,
  ): Promise<BenchmarkResult> {
    const latencies: number[] = []
    let successes = 0
    let failures = 0

    const memoryBefore = process.memoryUsage()

    const start = performance.now()
    const endAt = start + config.durationMs

    const workers: Promise<void>[] = []
    let counter = 0

    const work = async () => {
      while (performance.now() < endAt) {
        const id = `bench:${config.strategy}:${counter++}`
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

    for (let i = 0; i < config.concurrency; i++) {
      workers.push(work())
    }

    await Promise.all(workers)

    const elapsed = performance.now() - start
    const memoryAfter = process.memoryUsage()

    const sorted = latencies.slice().sort((a, b) => a - b)

    return {
      scenario: config.name,
      backend: config.backend,
      strategy: config.strategy,
      concurrency: config.concurrency,
      durationMs: config.durationMs,
      config: {
        limit: config.limit,
        windowMs: config.windowMs,
        cache: !!config.cache,
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
        max: sorted[sorted.length - 1]!,
        avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      },
      memory: {
        heapUsedMb: Math.round((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024),
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
