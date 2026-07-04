import type { RedisClientLike } from '../src/types'

type Row = { value: string; expiresAt: number }
type ZSetElement = { member: string; score: number }
type ZSet = { elements: ZSetElement[]; expiresAt: number }
type Hash = { fields: Record<string, string>; expiresAt: number }

export class MockRedisClient implements RedisClientLike {
    isOpen = true
    private store = new Map<string, Row>()
    private zsets = new Map<string, ZSet>()
    private hashes = new Map<string, Hash>()
    private scripts = new Map<string, string>()

    scriptLoad(script: string): string {
        const hash = 'mocksha1' + Math.random().toString(36).substring(7)
        this.scripts.set(hash, script)
        return hash
    }

    async evalSha(sha1: string, options: { keys: string[]; arguments: string[] }): Promise<unknown> {
        if (!this.scripts.has(sha1)) {
            throw new Error('NOSCRIPT No matching script. Please use EVAL.')
        }
        return this.eval(this.scripts.get(sha1)!, options)
    }

    private cleanExpired(now: number) {
        for (const [key, val] of this.store.entries()) {
            if (val.expiresAt <= now) {
                this.store.delete(key)
            }
        }
        for (const [key, val] of this.zsets.entries()) {
            if (val.expiresAt <= now) {
                this.zsets.delete(key)
            }
        }
        for (const [key, val] of this.hashes.entries()) {
            if (val.expiresAt <= now) {
                this.hashes.delete(key)
            }
        }
    }

    async eval(script: string, options: { keys: string[]; arguments: string[] }): Promise<unknown> {
        const { keys, arguments: args } = options
        const normalized = script.replace(/\s+/g, ' ').trim()

        // 1. Fixed Window script
        if (normalized.includes('math.floor(now / window) * window')) {
            const key = keys[0]!
            const windowMs = parseInt(args[0]!, 10)
            const limit = parseInt(args[1]!, 10)
            const now = Date.now()

            this.cleanExpired(now)

            const windowStart = Math.floor(now / windowMs) * windowMs
            const ttl = windowStart + windowMs - now

            if (!this.store.has(key)) {
                this.store.set(key, { value: '0', expiresAt: now + ttl })
            }

            const currentRecord = this.store.get(key)!
            const current = parseInt(currentRecord.value, 10) + 1
            this.store.set(key, { value: current.toString(), expiresAt: currentRecord.expiresAt })

            const allowed = current <= limit ? 1 : 0
            const remaining = Math.max(0, limit - current)

            return [allowed, current, remaining, ttl, now]
        }

        // 2. Sliding Window script
        if (normalized.includes('ZREMRANGEBYSCORE')) {
            const key = keys[0]!
            const windowMs = parseInt(args[0]!, 10)
            const limit = parseInt(args[1]!, 10)
            const uid = args[2]!
            const now = Date.now()

            this.cleanExpired(now)

            if (!this.zsets.has(key)) {
                this.zsets.set(key, { elements: [], expiresAt: now + windowMs })
            }

            const zset = this.zsets.get(key)!
            zset.elements = zset.elements.filter(el => el.score > now - windowMs)

            const current = zset.elements.length
            const allowed = current < limit ? 1 : 0
            const remaining = Math.max(0, limit - current - (allowed === 1 ? 1 : 0))

            if (allowed === 1) {
                zset.elements.push({ member: `${now}:${uid}`, score: now })
                zset.expiresAt = now + windowMs
            }

            const ttl = zset.expiresAt - now
            const oldestTs = zset.elements.length > 0 ? zset.elements[0]!.score : now - windowMs

            return [allowed, current + (allowed === 1 ? 1 : 0), remaining, ttl, oldestTs, now]
        }

        // 3. Token Bucket script
        if (normalized.includes('HMGET') && normalized.includes('HMSET')) {
            const key = keys[0]!
            const capacity = parseInt(args[0]!, 10)
            const refillRate = parseInt(args[1]!, 10)
            const now = Date.now()

            this.cleanExpired(now)

            if (!this.hashes.has(key)) {
                this.hashes.set(key, {
                    fields: {
                        tokens: capacity.toString(),
                        last_refill: now.toString(),
                    },
                    expiresAt: now + 3600000,
                })
            }

            const hash = this.hashes.get(key)!
            const existingTokens = parseFloat(hash.fields.tokens ?? capacity.toString())
            const lastRefill = parseFloat(hash.fields.last_refill ?? now.toString())

            const timeElapsed = (now - lastRefill) / 1000
            const tokensToAdd = timeElapsed * refillRate
            let tokens = Math.min(capacity, existingTokens + tokensToAdd)

            const allowed = tokens >= 1 ? 1 : 0
            if (allowed === 1) {
                tokens = tokens - 1
            }

            hash.fields.tokens = tokens.toString()
            hash.fields.last_refill = now.toString()
            hash.expiresAt = now + 3600000

            let timeUntilNext = 0
            if (tokens < 1) {
                timeUntilNext = Math.ceil(((1 - tokens) / refillRate) * 1000)
            }

            return [allowed, Math.floor(tokens), timeUntilNext]
        }

        // 4. Individual Fixed Window script
        if (normalized.includes('startKey') && normalized.includes('countKey')) {
            const startKey = keys[0]!
            const countKey = keys[1]!
            const windowMs = parseInt(args[0]!, 10)
            const limit = parseInt(args[1]!, 10)
            const now = Date.now()

            this.cleanExpired(now)

            let start = this.store.has(startKey)
                ? parseInt(this.store.get(startKey)!.value, 10)
                : null

            if (start === null) {
                start = now
                this.store.set(startKey, { value: start.toString(), expiresAt: now + windowMs })
            } else {
                if (now >= start + windowMs) {
                    start = now
                    this.store.set(startKey, {
                        value: start.toString(),
                        expiresAt: now + windowMs,
                    })
                    this.store.delete(countKey)
                }
            }

            let ttlMs = start + windowMs - now
            if (ttlMs <= 0) ttlMs = 1

            if (!this.store.has(countKey)) {
                this.store.set(countKey, { value: '0', expiresAt: now + ttlMs })
            }

            const countRecord = this.store.get(countKey)!
            let current = parseInt(countRecord.value, 10) + 1
            this.store.set(countKey, {
                value: current.toString(),
                expiresAt: countRecord.expiresAt,
            })

            const allowed = current <= limit ? 1 : 0
            if (allowed === 0) {
                current = current - 1
                this.store.set(countKey, {
                    value: current.toString(),
                    expiresAt: countRecord.expiresAt,
                })
            }

            return [allowed, current, Math.max(0, limit - current), start + windowMs]
        }

        throw new Error(`Unsupported Mock Lua Script: ${normalized}`)
    }

    async get(key: string): Promise<string | null> {
        this.cleanExpired(Date.now())
        const item = this.store.get(key)
        return item ? item.value : null
    }

    async set(key: string, value: string, ...args: any[]): Promise<any> {
        const now = Date.now()
        let expiresAt = now + 3600000 // default 1 hour
        const lastArg = args[args.length - 1]
        if (lastArg && typeof lastArg === 'object' && 'PX' in lastArg) {
            expiresAt = now + lastArg.PX
        } else if (args[0] === 'PX' && typeof args[1] === 'number') {
            expiresAt = now + args[1]
        }

        this.store.set(key, { value, expiresAt })
        return 'OK'
    }

    async del(...keys: (string | string[])[]): Promise<number> {
        const flatKeys = keys.flat()
        let count = 0
        for (const key of flatKeys) {
            if (this.store.delete(key)) count++
            if (this.zsets.delete(key)) count++
            if (this.hashes.delete(key)) count++
        }
        return count
    }

    async pExpire(key: string, ttlMs: number): Promise<unknown> {
        const now = Date.now()
        const expiresAt = now + ttlMs

        const row = this.store.get(key)
        if (row) {
            row.expiresAt = expiresAt
            return 1
        }
        const zset = this.zsets.get(key)
        if (zset) {
            zset.expiresAt = expiresAt
            return 1
        }
        const hash = this.hashes.get(key)
        if (hash) {
            hash.expiresAt = expiresAt
            return 1
        }
        return 0
    }

    multi(): any {
        const ops: (() => Promise<unknown>)[] = []

        return {
            get: (key: string): void => {
                ops.push(() => this.get(key))
            },
            set: (key: string, value: string, options?: any): void => {
                ops.push(() => this.set(key, value, options))
            },
            del: (...keys: string[]): void => {
                ops.push(() => this.del(...keys))
            },
            evalSha: (sha1: string, options: { keys: string[]; arguments: string[] }): void => {
                ops.push(() => this.evalSha(sha1, options))
            },
            eval: (script: string, options: { keys: string[]; arguments: string[] }): void => {
                ops.push(() => this.eval(script, options))
            },
            exec: async (): Promise<unknown[]> => {
                const results: unknown[] = []
                for (const op of ops) {
                    try {
                        results.push(await op())
                    } catch (e) {
                        results.push(e)
                    }
                }
                return results
            },
        }
    }
}
