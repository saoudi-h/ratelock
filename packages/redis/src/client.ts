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

function detectDriver(raw: unknown): 'redis' | 'ioredis' {
    if (raw && typeof raw === 'object') {
        // ioredis v5 has 'status' and 'connector'; node-redis has 'isOpen'
        if ('connector' in raw) return 'ioredis'
        if ('isOpen' in raw) return 'redis'
        // Both have 'ping' - check after more specific properties
        if ('status' in raw) return 'ioredis'
        if ('ping' in raw) return 'redis'
    }
    throw new Error('Unrecognized Redis client. Provide a redis (node-redis) or ioredis instance.')
}

async function loadFromUrl(
    url: string,
    driver?: 'redis' | 'ioredis'
): Promise<{ client: unknown; disconnect: () => Promise<void> }> {
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
        'No Redis client found. Install redis or ioredis:\n' +
            '  npm install redis\n' +
            '  npm install ioredis'
    )
}

export function adaptClient(raw: unknown): RedisClient {
    const driver = detectDriver(raw)

    return {
        async eval(script, keys, args): Promise<unknown> {
            if (driver === 'redis') {
                const client = raw as any
                return client.eval(script, { keys, arguments: args })
            }
            const client = raw as any
            return client.eval(script, keys.length, ...keys, ...args)
        },

        async evalsha(sha1, keys, args): Promise<unknown> {
            if (driver === 'redis') {
                const client = raw as any
                return client.evalSha(sha1, { keys, arguments: args })
            }
            const client = raw as any
            return client.evalsha(sha1, keys.length, ...keys, ...args)
        },

        async loadScript(script: string): Promise<string> {
            const client = raw as any
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
            if (driver === 'redis') {
                await client.set(key, value, { PX: ttlMs })
            } else {
                await client.set(key, value, 'PX', ttlMs)
            }
        },

        async del(...keys: string[]): Promise<number> {
            if (keys.length === 0) return 0
            const client = raw as any
            return client.del(keys)
        },

        async pExpire(key: string, ttlMs: number): Promise<unknown> {
            const client = raw as any
            if (driver === 'redis') {
                return client.pExpire(key, ttlMs)
            }
            return client.pexpire(key, ttlMs)
        },

        multi(): any {
            const client = raw as any
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
            '  fixedWindow({ url: "redis://localhost:6379", ... })'
    )
}
