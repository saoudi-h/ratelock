export type BackendType = 'memory' | 'redis' | 'postgres'

export interface PerformanceMetric {
    name: string
    throughput: number
    latency: string
    isRateLock: boolean
    color: string
}

export interface BackendData {
    title: string
    description: string
    multiplier: string
    metrics: PerformanceMetric[]
}

export const BACKEND_DATA: Record<BackendType, BackendData> = {
    memory: {
        title: 'In-Memory Counter Throughput',
        description: 'In-memory JS Maps with zero network round-trips.',
        multiplier: '2.81x higher',
        metrics: [
            {
                name: 'RateLock Local Fixed Window',
                throughput: 2088809,
                latency: '0.04ms',
                isRateLock: true,
                color: 'from-emerald-500 to-teal-500',
            },
            {
                name: 'rate-limiter-flexible Memory',
                throughput: 744508,
                latency: '0.11ms',
                isRateLock: false,
                color: 'from-muted-foreground/30 to-muted-foreground/40',
            },
        ],
    },
    redis: {
        title: 'Distributed Redis Throughput',
        description: 'Atomic Lua scripts executed directly on the Redis thread.',
        multiplier: '1.71x higher',
        metrics: [
            {
                name: 'RateLock Redis Fixed Window',
                throughput: 142637,
                latency: '0.56ms',
                isRateLock: true,
                color: 'from-red-500 to-orange-500',
            },
            {
                name: 'rate-limiter-flexible Redis',
                throughput: 83403,
                latency: '0.96ms',
                isRateLock: false,
                color: 'from-muted-foreground/30 to-muted-foreground/40',
            },
        ],
    },
    postgres: {
        title: 'PostgreSQL Throughput',
        description:
            'Targeted UPSERT queries with named prepared statements. Production-default durability.',
        multiplier: '1.04x higher',
        metrics: [
            {
                name: 'RateLock Postgres Fixed Window',
                throughput: 29330,
                latency: '2.80ms',
                isRateLock: true,
                color: 'from-sky-500 to-indigo-500',
            },
            {
                name: 'rate-limiter-flexible Postgres',
                throughput: 28171,
                latency: '2.88ms',
                isRateLock: false,
                color: 'from-muted-foreground/30 to-muted-foreground/40',
            },
        ],
    },
}
