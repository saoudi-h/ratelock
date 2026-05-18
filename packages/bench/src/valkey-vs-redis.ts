import { createClient } from 'redis'
import IORedis from 'ioredis'
import { createFixedWindowLimiter } from '@ratelock/redis'
import { performance } from 'perf_hooks'

async function bench(name: string, check: (id: string) => Promise<unknown>, durationMs = 3000) {
  const latencies: number[] = []
  let ok = 0
  const start = performance.now()
  const workers: Promise<void>[] = []
  let counter = 0

  for (let w = 0; w < 10; w++) {
    workers.push((async () => {
      while (performance.now() < start + durationMs) {
        const id = `valkey-vs-redis-${counter++}`
        const t0 = performance.now()
        try { await check(id); latencies.push(performance.now() - t0); ok++ } catch { }
      }
    })())
  }

  await Promise.all(workers)
  const elapsed = performance.now() - start
  const sorted = latencies.sort((a, b) => a - b)

  console.log(`  ${name}`)
  console.log(`    ops/sec:     ${Math.round(ok / elapsed * 1000).toLocaleString()}`)
  console.log(`    requests:    ${ok}`)
  console.log(`    p50:         ${((sorted[Math.floor(sorted.length * 0.5)] ?? 0) * 1000).toFixed(0)}μs`)
  console.log(`    p95:         ${((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 1000).toFixed(0)}μs`)
  console.log(`    p99:         ${((sorted[Math.floor(sorted.length * 0.99)] ?? 0) * 1000).toFixed(0)}μs`)
  console.log()
}

async function main() {
  // Valkey via node-redis client
  const v1 = createClient({ url: 'redis://localhost:6381' })
  await v1.connect()
  const l1 = await createFixedWindowLimiter({ client: v1, limit: 100000, windowMs: 60000 })
  await bench('Valkey    (node-redis client)', (id) => l1.check(id))
  await v1.quit()

  // Valkey via ioredis client
  const v2 = new IORedis('redis://localhost:6381')
  const l2 = await createFixedWindowLimiter({ client: v2, limit: 100000, windowMs: 60000 })
  await bench('Valkey    (ioredis client)', (id) => l2.check(id))
  v2.disconnect()

  // Redis via node-redis client (baseline)
  const r1 = createClient({ url: 'redis://localhost:6380' })
  await r1.connect()
  const l3 = await createFixedWindowLimiter({ client: r1, limit: 100000, windowMs: 60000 })
  await bench('Redis     (node-redis client)', (id) => l3.check(id))
  await r1.quit()

  // Redis via ioredis client (baseline)
  const r2 = new IORedis('redis://localhost:6380')
  const l4 = await createFixedWindowLimiter({ client: r2, limit: 100000, windowMs: 60000 })
  await bench('Redis     (ioredis client)', (id) => l4.check(id))
  r2.disconnect()
}

main().catch(console.error)
