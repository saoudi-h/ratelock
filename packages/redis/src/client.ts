import type { RedisLimiterBaseConfig } from './types'

export interface RedisClient {
    eval(script: string, keys: string[], args: string[]): Promise<unknown>
    evalsha(sha1: string, keys: string[], args: string[]): Promise<unknown>
    loadScript(script: string): Promise<string>
    get(key: string): Promise<string | null>
    set(key: string, value: string, ttlMs: number): Promise<void>
    del(...keys: string[]): Promise<number>
    pExpire(key: string, ttlMs: number): Promise<unknown>
    multi(): {
        get(key: string): void
        set(key: string, value: string, ttlMs: number): void
        del(...keys: string[]): void
        exec(): Promise<unknown[]>
    }
    pipeline(): {
        evalsha(sha1: string, keys: string[], args: string[]): void
        eval(script: string, keys: string[], args: string[]): void
        exec(): Promise<unknown[]>
    }
}

function detectDriver(raw: unknown): 'redis' | 'ioredis' | 'bun' {
    if (raw && typeof raw === 'object') {
        // Bun's native RedisClient exposes send(command, args); node-redis and
        // ioredis expose sendCommand instead, so this check must come before
        // any heuristic that falls back on shared methods like ping/get.
        if ('send' in raw && typeof (raw as any).send === 'function') return 'bun'
        // ioredis v5 has 'status' and 'connector'; node-redis has 'isOpen'
        if ('connector' in raw) return 'ioredis'
        if ('isOpen' in raw) return 'redis'
        // Both have 'ping' - check after more specific properties
        if ('status' in raw) return 'ioredis'
        if ('ping' in raw) return 'redis'
    }
    throw new Error(
        'Unrecognized Redis client. Provide a redis (node-redis), ioredis, or Bun RedisClient instance.'
    )
}

async function loadFromUrl(
    url: string,
    driver?: 'redis' | 'ioredis' | 'bun'
): Promise<{ client: unknown; disconnect: () => Promise<void> }> {
    if (driver === 'bun') {
        // Non-literal specifier keeps TS from resolving the module at compile
        // time (no bun-types dependency); resolution happens under Bun only.
        const bunModuleId = 'bun'
        try {
            const mod: any = await import(bunModuleId)
            const client = new mod.RedisClient(url)
            return {
                client,
                disconnect: async () => {
                    void client.close()
                },
            }
        } catch {
            throw new Error(
                'bun module not found - the "bun" driver requires the Bun runtime (>= 1.4)'
            )
        }
    }
    if (driver === 'redis' || !driver) {
        try {
            const mod = await import('redis')
            const client = mod.createClient({ url })
            await client.connect()
            return {
                client,
                disconnect: async () => {
                    void client.quit()
                },
            }
        } catch {
            if (driver === 'redis') throw new Error('redis package not found')
        }
    }
    if (driver === 'ioredis') {
        try {
            const { default: IORedis } = await import('ioredis')
            const client = new IORedis(url)
            return {
                client,
                disconnect: async () => {
                    void client.quit()
                },
            }
        } catch {
            throw new Error('ioredis package not found')
        }
    }
    throw new Error(
        'No Redis client found. Install redis or ioredis, or run under Bun (>= 1.4) with driver: "bun":\n' +
            '  npm install redis\n' +
            '  npm install ioredis'
    )
}

/** Queued batch over Bun's auto-pipelined send(): commands flush concurrently on exec(). */
function createBunBatch(client: any): {
    get(key: string): void
    set(key: string, value: string, ttlMs: number): void
    del(...keys: string[]): void
    evalsha(sha1: string, keys: string[], args: string[]): void
    eval(script: string, keys: string[], args: string[]): void
    exec(): Promise<unknown[]>
} {
    const queue: Array<() => Promise<unknown>> = []
    const push = (fn: () => Promise<unknown>) => queue.push(fn)
    return {
        get(key: string) {
            push(() => client.get(key))
        },
        set(key: string, value: string, ttlMs: number) {
            push(() => client.send('SET', [key, value, 'PX', String(ttlMs)]))
        },
        del(...keys: string[]) {
            const flat = keys.flat()
            if (flat.length > 0) push(() => client.del(...flat))
        },
        evalsha(sha1: string, keys: string[], args: string[]) {
            push(() => client.send('EVALSHA', [sha1, String(keys.length), ...keys, ...args]))
        },
        eval(script: string, keys: string[], args: string[]) {
            push(() => client.send('EVAL', [script, String(keys.length), ...keys, ...args]))
        },
        async exec(): Promise<unknown[]> {
            const pending = [...queue]
            queue.length = 0
            return Promise.all(pending.map(run => run()))
        },
    }
}

export function adaptClient(raw: unknown): RedisClient {
    const driver = detectDriver(raw)

    return {
        async eval(script, keys, args): Promise<unknown> {
            const client = raw as any
            if (driver === 'bun') {
                return client.send('EVAL', [script, String(keys.length), ...keys, ...args])
            }
            if (driver === 'redis') {
                return client.eval(script, { keys, arguments: args })
            }
            return client.eval(script, keys.length, ...keys, ...args)
        },

        async evalsha(sha1, keys, args): Promise<unknown> {
            const client = raw as any
            if (driver === 'bun') {
                return client.send('EVALSHA', [sha1, String(keys.length), ...keys, ...args])
            }
            if (driver === 'redis') {
                return client.evalSha(sha1, { keys, arguments: args })
            }
            return client.evalsha(sha1, keys.length, ...keys, ...args)
        },

        async loadScript(script: string): Promise<string> {
            const client = raw as any
            if (driver === 'bun') {
                return client.send('SCRIPT', ['LOAD', script])
            }
            if (driver === 'redis') {
                return client.scriptLoad(script)
            }
            return client.script('load', script)
        },

        async get(key: string): Promise<string | null> {
            const client = raw as any
            return client.get(key)
        },

        async set(key: string, value: string, ttlMs: number): Promise<void> {
            const client = raw as any
            if (driver === 'bun') {
                await client.send('SET', [key, value, 'PX', String(ttlMs)])
            } else if (driver === 'redis') {
                await client.set(key, value, { PX: ttlMs })
            } else {
                await client.set(key, value, 'PX', ttlMs)
            }
        },

        async del(...keys: string[]): Promise<number> {
            if (keys.length === 0) return 0
            const client = raw as any
            if (driver === 'bun') {
                return client.del(...keys)
            }
            return client.del(keys)
        },

        async pExpire(key: string, ttlMs: number): Promise<unknown> {
            const client = raw as any
            if (driver === 'bun') {
                return client.send('PEXPIRE', [key, String(ttlMs)])
            }
            if (driver === 'redis') {
                return client.pExpire(key, ttlMs)
            }
            return client.pexpire(key, ttlMs)
        },

        multi(): any {
            const client = raw as any
            if (driver === 'bun') {
                return createBunBatch(client)
            }
            const m = client.multi()
            return {
                get(key: string) {
                    m.get(key)
                },
                set(key: string, value: string, ttlMs: number) {
                    if (driver === 'redis') {
                        m.set(key, value, { PX: ttlMs })
                    } else {
                        m.set(key, value, 'PX', ttlMs)
                    }
                },
                del(...keys: string[]) {
                    if (keys.length === 0) return
                    m.del(keys)
                },
                async exec(): Promise<unknown[]> {
                    const results = await m.exec()
                    if (!results) return []
                    const mapped =
                        driver === 'ioredis'
                            ? results.map((r: any) => (Array.isArray(r) ? (r[0] ? r[0] : r[1]) : r))
                            : results

                    for (const r of mapped) {
                        if (r instanceof Error) throw r
                    }
                    return mapped
                },
            }
        },

        pipeline(): any {
            const client = raw as any
            if (driver === 'bun') {
                return createBunBatch(client)
            }
            const p = driver === 'ioredis' ? client.pipeline() : client.multi()
            return {
                evalsha(sha1: string, keys: string[], args: string[]) {
                    if (driver === 'redis') {
                        p.evalSha(sha1, { keys, arguments: args })
                    } else {
                        p.evalsha(sha1, keys.length, ...keys, ...args)
                    }
                },
                eval(script: string, keys: string[], args: string[]) {
                    if (driver === 'redis') {
                        p.eval(script, { keys, arguments: args })
                    } else {
                        p.eval(script, keys.length, ...keys, ...args)
                    }
                },
                async exec(): Promise<unknown[]> {
                    const results = await p.exec()
                    if (!results) return []
                    const mapped =
                        driver === 'ioredis'
                            ? results.map((r: any) => (Array.isArray(r) ? (r[0] ? r[0] : r[1]) : r))
                            : results

                    for (const r of mapped) {
                        if (r instanceof Error) throw r
                    }
                    return mapped
                },
            }
        },
    }
}

export async function createConnection(
    config: RedisLimiterBaseConfig
): Promise<{ client: RedisClient; disconnect: () => Promise<void> }> {
    if (config.client) {
        return {
            client: adaptClient(config.client),
            disconnect: async () => {},
        }
    }

    if (config.url) {
        const raw = await loadFromUrl(config.url, config.driver)
        return { client: adaptClient(raw.client), disconnect: raw.disconnect }
    }

    throw new Error(
        'Provide either a Redis client instance or a connection URL.\n' +
            '  fixedWindow({ client: myRedisClient, ... })\n' +
            '  fixedWindow({ url: "redis://localhost:6379", driver: "bun" }) // Bun >= 1.4\n' +
            '  fixedWindow({ url: "redis://localhost:6379" })'
    )
}
