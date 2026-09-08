import type { RedisScriptClient } from '@ratelock/redis-common'

import type { UpstashLimiterBaseConfig, UpstashRedisClient } from './types'

export function adaptClient(raw: UpstashRedisClient): RedisScriptClient {
    return {
        loadScript(script: string): Promise<string> {
            return raw.scriptLoad(script)
        },
        evalsha(sha1: string, keys: string[], args: string[]): Promise<unknown> {
            return raw.evalsha(sha1, keys, args)
        },
        pipeline() {
            const pipeline = raw.pipeline()

            return {
                evalsha(sha1: string, keys: string[], args: string[]): void {
                    pipeline.evalsha(sha1, keys, args)
                },
                exec(): Promise<unknown[]> {
                    return pipeline.exec()
                },
            }
        },
    }
}

export async function createConnection(
    config: UpstashLimiterBaseConfig
): Promise<{ client: RedisScriptClient; disconnect: () => Promise<void> }> {
    if (!config.client) {
        throw new Error(
            'Provide an Upstash Redis client instance.\n' +
                '  fixedWindow({ client: new Redis({ url, token }), ... })'
        )
    }

    return {
        client: adaptClient(config.client),
        // @upstash/redis is HTTP-based and owns no socket that RateLock should close.
        disconnect: async () => {},
    }
}
