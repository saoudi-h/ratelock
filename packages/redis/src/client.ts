export interface RedisClient {
    eval(script: string, keys: string[], args: string[]): Promise<unknown>
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
}

function detectDriver(raw: unknown): 'redis' | 'ioredis' {
  if (raw && typeof raw === 'object') {
    // ioredis v5 has 'status' and 'connector'; node-redis has 'isOpen'
    if ('connector' in raw) return 'ioredis'
    if ('isOpen' in raw) return 'redis'
    // Both have 'ping' — check after more specific properties
    if ('status' in raw) return 'ioredis'
    if ('ping' in raw) return 'redis'
  }
  throw new Error(
    'Unrecognized Redis client. Provide a redis (node-redis) or ioredis instance.'
  )
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
            if (driver === 'ioredis') throw new Error('ioredis package not found')
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

        async get(key: string): Promise<string | null> {
            const client = raw as any
            return client.get(key)
        },

        async set(key: string, value: string, ttlMs: number): Promise<void> {
            const client = raw as any
            if (driver === 'redis') {
                client.set(key, value, { PX: ttlMs })
            } else {
                client.set(key, value, 'PX', ttlMs)
            }
        },

        async del(...keys: string[]): Promise<number> {
            const client = raw as any
            return client.del(keys)
        },

        async pExpire(key: string, ttlMs: number): Promise<unknown> {
            const client = raw as any
            return client.pExpire(key, ttlMs)
        },

        multi(): any {
            const client = raw as any
            if (driver === 'redis') return client.multi()
            return client.multi()
        },
    }
}

export async function createConnection(config: {
    client?: unknown
    url?: string
    driver?: 'redis' | 'ioredis'
}): Promise<{ client: RedisClient; disconnect: () => Promise<void> }> {
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
            '  createFixedWindowLimiter({ client: myRedisClient, ... })\n' +
            '  createFixedWindowLimiter({ url: "redis://localhost:6379", ... })'
    )
}
