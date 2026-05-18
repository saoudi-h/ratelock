export type Backend = 'local' | 'redis' | 'postgres'
export type Strategy =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'

export type ScenarioConfig = {
    name: string
    backend: Backend
    strategy: Strategy
    concurrency: number
    durationMs: number
    limit: number
    windowMs: number
    cache?: { maxSize: number; ttlMs: number }
    retry?: { maxAttempts: number }
}

export type BenchmarkResult = {
    scenario: string
    backend: Backend
    strategy: Strategy
    concurrency: number
    durationMs: number
    config: { limit: number; windowMs: number; cache?: boolean }

    totalRequests: number
    successes: number
    failures: number
    throughput: number
    throughputUnit: 'ops/sec'

    latencyMs: {
        min: number
        p50: number
        p95: number
        p99: number
        max: number
        avg: number
    }

    memory: {
        heapUsedMb: number
        heapTotalMb: number
    }

    error?: string
}

export type BenchmarkSuite = {
    meta: {
        date: string
        node: string
        platform: string
        arch: string
    }
    results: BenchmarkResult[]
}
