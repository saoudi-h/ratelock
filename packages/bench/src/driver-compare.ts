import { fixedWindow as createLocalFixed } from '@ratelock/local'
import { performance } from 'perf_hooks'

async function bench(name: string, check: (id: string) => Promise<unknown>, durationMs = 3000) {
    const latencies: number[] = []
    let ok = 0
    const start = performance.now()
    const workers: Promise<void>[] = []
    let counter = 0

    for (let w = 0; w < 10; w++) {
        workers.push(
            (async () => {
                while (performance.now() < start + durationMs) {
                    const id = `${name}-${counter++}`
                    const t0 = performance.now()
                    try {
                        await check(id)
                        latencies.push(performance.now() - t0)
                        ok++
                    } catch {
                        // ignore errors
                    }
                }
            })()
        )
    }

    await Promise.all(workers)
    const elapsed = performance.now() - start
    const sorted = latencies.sort((a, b) => a - b)

    console.log(`  ${name}`)
    console.log(`    ops/sec:     ${Math.round((ok / elapsed) * 1000).toLocaleString()}`)
    console.log(`    requests:    ${ok}`)
    console.log(
        `    p50:         ${((sorted[Math.floor(sorted.length * 0.5)] ?? 0) * 1000).toFixed(0)}μs`
    )
    console.log(
        `    p95:         ${((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 1000).toFixed(0)}μs`
    )
    console.log(
        `    p99:         ${((sorted[Math.floor(sorted.length * 0.99)] ?? 0) * 1000).toFixed(0)}μs`
    )
    console.log()
}

async function main() {
    console.log()
    console.log('  RateLock Driver Comparison')
    console.log('  ─────────────────────────')
    console.log()

    // 1. Local reference
    const local = await createLocalFixed({ limit: 10000, windowMs: 60000 })
    await bench('local        (in-memory)', id => local.check(id))

    // 2. Redis drivers
    try {
        const { createClient } = await import('redis')
        const c1 = createClient({ url: 'redis://:testpassword@localhost:6380' })
        await c1.connect()
        const { fixedWindow: r1 } = await import('@ratelock/redis')
        const l1 = await r1({ client: c1, limit: 10000, windowMs: 60000 })
        await bench('redis        (node-redis)', id => l1.check(id))
        await c1.quit()
    } catch (e: any) {
        console.log(`  redis (node-redis): SKIPPED (${e.message})\n`)
    }

    try {
        const { default: IORedis } = await import('ioredis')
        const c2 = new IORedis('redis://:testpassword@localhost:6380')
        const { fixedWindow: r2 } = await import('@ratelock/redis')
        const l2 = await r2({ client: c2, limit: 10000, windowMs: 60000 })
        await bench('redis        (ioredis)', id => l2.check(id))
        c2.disconnect()
    } catch (e: any) {
        console.log(`  redis (ioredis): SKIPPED (${e.message})\n`)
    }

    // 3. PostgreSQL drivers
    try {
        const postgres = (await import('postgres')).default
        const p1 = postgres('postgres://ratelock:ratelock@localhost:5433/ratelock_bench', {
            onnotice: () => {},
        })
        const { fixedWindow: pg1 } = await import('@ratelock/postgres')
        const l3 = await pg1({ sql: p1, limit: 10000, windowMs: 60000, skipMigrations: true })
        await bench('postgresql   (postgres.js)', id => l3.check(id))
        await p1.end()
    } catch (e: any) {
        console.log(`  postgresql (postgres.js): SKIPPED (${e.message})\n`)
    }

    try {
        const pgName = 'pg'
        const { default: pg } = (await import(pgName)) as any
        const pool = new pg.Pool({
            connectionString: 'postgres://ratelock:ratelock@localhost:5433/ratelock_bench',
        })
        const { fixedWindow: pg2 } = await import('@ratelock/postgres')
        const l4 = await pg2({ pool, limit: 10000, windowMs: 60000, skipMigrations: true })
        await bench('postgresql   (pg)', id => l4.check(id))
        await pool.end()
    } catch (e: any) {
        console.log(`  postgresql (pg): SKIPPED (${e.message})\n`)
    }
}

main().catch(console.error)
