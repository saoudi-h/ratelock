export interface BenchmarkConfig {
    benchDuration: number
    benchConcurrency: number
    benchLatencyMs: number
    limit: number
    windowMs: number
    postgresUrl: string
    redisUrl: string
    valkeyUrl: string
    benchUnlogged: boolean
}

export const config: BenchmarkConfig = {
    benchDuration: parseInt(process.env.BENCH_DURATION ?? '2000', 10),
    benchConcurrency: parseInt(process.env.BENCH_CONCURRENCY ?? '80', 10),
    benchLatencyMs: parseInt(process.env.BENCH_LATENCY_MS ?? '0', 10),
    limit: parseInt(process.env.BENCH_LIMIT ?? '1000', 10),
    windowMs: parseInt(process.env.BENCH_WINDOW_MS ?? '60000', 10),
    postgresUrl:
        process.env.POSTGRES_URL ?? 'postgres://postgres:testpassword@localhost:5434/ratelock_test',
    redisUrl: process.env.REDIS_URL ?? 'redis://:testpassword@localhost:6380',
    valkeyUrl: process.env.VALKEY_URL ?? 'redis://:testpassword@localhost:6381',
    benchUnlogged: process.env.BENCH_UNLOGGED !== 'false',
}
