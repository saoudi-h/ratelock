import type { UpstashRedisClient } from '../src/types'

type Row = { value: string; expiresAt: number }
type ZSetElement = { member: string; score: number }
type ZSet = { elements: ZSetElement[]; expiresAt: number }
type Hash = { fields: Record<string, string>; expiresAt: number }
type PendingCall = { sha1: string; keys: string[]; args: string[] }

/** A small in-memory Redis script interpreter for fast Upstash contract tests. */
class MockRedisScriptEngine {
    private store = new Map<string, Row>()
    private zsets = new Map<string, ZSet>()
    private hashes = new Map<string, Hash>()
    private scripts = new Map<string, string>()

    scriptLoad(script: string): string {
        const hash = `mocksha1${Math.random().toString(36).substring(7)}`
        this.scripts.set(hash, script)
        return hash
    }

    async evalSha(sha1: string, keys: string[], args: string[]): Promise<unknown> {
        const script = this.scripts.get(sha1)
        if (!script) throw new Error('NOSCRIPT No matching script. Please use EVAL.')
        return this.eval(script, keys, args)
    }

    private cleanExpired(now: number): void {
        for (const [key, value] of this.store) {
            if (value.expiresAt <= now) this.store.delete(key)
        }
        for (const [key, value] of this.zsets) {
            if (value.expiresAt <= now) this.zsets.delete(key)
        }
        for (const [key, value] of this.hashes) {
            if (value.expiresAt <= now) this.hashes.delete(key)
        }
    }

    private eval(script: string, keys: string[], args: string[]): unknown {
        const normalized = script.replace(/\s+/g, ' ').trim()
        const now = Date.now()
        this.cleanExpired(now)

        if (normalized.includes('math.floor(now / window) * window')) {
            const key = keys[0]!
            const windowMs = Number(args[0])
            const limit = Number(args[1])
            const windowStart = Math.floor(now / windowMs) * windowMs
            const ttl = windowStart + windowMs - now
            const currentRecord = this.store.get(key) ?? {
                value: '0',
                expiresAt: now + ttl,
            }
            const current = Number(currentRecord.value) + 1
            this.store.set(key, { value: String(current), expiresAt: currentRecord.expiresAt })
            return [current <= limit ? 1 : 0, current, Math.max(0, limit - current), ttl, now]
        }

        if (normalized.includes('ZREMRANGEBYSCORE')) {
            const key = keys[0]!
            const windowMs = Number(args[0])
            const limit = Number(args[1])
            const uid = args[2]!
            const zset = this.zsets.get(key) ?? { elements: [], expiresAt: now + windowMs }
            zset.elements = zset.elements.filter(element => element.score > now - windowMs)
            const current = zset.elements.length
            const allowed = current < limit ? 1 : 0
            const remaining = Math.max(0, limit - current - allowed)
            if (allowed) {
                zset.elements.push({ member: `${now}:${uid}`, score: now })
                zset.expiresAt = now + windowMs
            }
            this.zsets.set(key, zset)
            const ttl = zset.expiresAt - now
            const oldest = zset.elements[0]?.score ?? now - windowMs
            return [allowed, current + allowed, remaining, ttl, oldest, now]
        }

        if (normalized.includes('HMGET') && normalized.includes('HMSET')) {
            const key = keys[0]!
            const capacity = Number(args[0])
            const refillRate = Number(args[1])
            const hash = this.hashes.get(key) ?? {
                fields: { tokens: String(capacity), last_refill: String(now) },
                expiresAt: now + 3_600_000,
            }
            const previousTokens = Number(hash.fields.tokens)
            const lastRefill = Number(hash.fields.last_refill)
            let tokens = Math.min(
                capacity,
                previousTokens + ((now - lastRefill) / 1000) * refillRate
            )
            const allowed = tokens >= 1 ? 1 : 0
            if (allowed) tokens -= 1
            hash.fields.tokens = String(tokens)
            hash.fields.last_refill = String(now)
            hash.expiresAt = now + 3_600_000
            this.hashes.set(key, hash)
            const refillTime = tokens < 1 ? Math.ceil(((1 - tokens) / refillRate) * 1000) : 0
            return [allowed, Math.floor(tokens), refillTime]
        }

        if (normalized.includes('startKey') && normalized.includes('countKey')) {
            const startKey = keys[0]!
            const countKey = keys[1]!
            const windowMs = Number(args[0])
            const limit = Number(args[1])
            let start = this.store.has(startKey) ? Number(this.store.get(startKey)!.value) : now

            if (now >= start + windowMs) {
                start = now
                this.store.set(startKey, { value: String(start), expiresAt: now + windowMs })
                this.store.delete(countKey)
            } else if (!this.store.has(startKey)) {
                this.store.set(startKey, { value: String(start), expiresAt: now + windowMs })
            }

            const ttl = Math.max(1, start + windowMs - now)
            const countRecord = this.store.get(countKey) ?? { value: '0', expiresAt: now + ttl }
            let current = Number(countRecord.value) + 1
            const allowed = current <= limit ? 1 : 0
            if (!allowed) current -= 1
            this.store.set(countKey, { value: String(current), expiresAt: countRecord.expiresAt })
            return [allowed, current, Math.max(0, limit - current), start + windowMs]
        }

        throw new Error(`Unsupported Mock Lua Script: ${normalized}`)
    }
}

/** A fake with the same command methods used by `@upstash/redis`. */
export function createMockUpstashClient(): UpstashRedisClient {
    const engine = new MockRedisScriptEngine()
    const client = {
        async scriptLoad(script: string): Promise<string> {
            return engine.scriptLoad(script)
        },
        async evalsha(sha1: string, keys: string[], args: string[]): Promise<unknown> {
            return engine.evalSha(sha1, keys, args)
        },
        pipeline() {
            const calls: PendingCall[] = []
            return {
                evalsha(sha1: string, keys: string[], args: string[]): void {
                    calls.push({ sha1, keys, args })
                },
                async exec(): Promise<unknown[]> {
                    const results: unknown[] = []
                    for (const call of calls) {
                        results.push(await client.evalsha(call.sha1, call.keys, call.args))
                    }
                    return results
                },
            }
        },
    }

    return client as UpstashRedisClient
}
