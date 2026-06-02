export interface BenchmarkConfig {
    benchDuration: number
    benchConcurrency: number
    benchLatencyMs: number
    benchWarmupMs: number
    benchRuns: number
    benchGc: boolean
    limit: number
    windowMs: number
    postgresUrl: string
    redisUrl: string
    valkeyUrl: string
    benchUnlogged: boolean
}

function envFlag(name: string, defaultValue: boolean): boolean {
    const raw = process.env[name]
    if (raw === undefined) return defaultValue
    return raw !== 'false' && raw !== '0' && raw !== ''
}

export const config: BenchmarkConfig = {
    benchDuration: parseInt(process.env.BENCH_DURATION ?? '2000', 10),
    benchConcurrency: parseInt(process.env.BENCH_CONCURRENCY ?? '80', 10),
    benchLatencyMs: parseInt(process.env.BENCH_LATENCY_MS ?? '0', 10),
    benchWarmupMs: parseInt(process.env.BENCH_WARMUP_MS ?? '500', 10),
    benchRuns: Math.max(1, parseInt(process.env.BENCH_RUNS ?? '3', 10)),
    benchGc: envFlag('BENCH_GC', false),
    limit: parseInt(process.env.BENCH_LIMIT ?? '1000', 10),
    windowMs: parseInt(process.env.BENCH_WINDOW_MS ?? '60000', 10),
    postgresUrl:
        process.env.POSTGRES_URL ?? 'postgres://ratelock:ratelock@localhost:5433/ratelock_bench',
    redisUrl: process.env.REDIS_URL ?? 'redis://:testpassword@localhost:6380',
    valkeyUrl: process.env.VALKEY_URL ?? 'redis://:testpassword@localhost:6381',
    benchUnlogged: envFlag('BENCH_UNLOGGED', true),
}
