import type { Storage, StoragePipeline } from '@ratelock/core/storage'
import type { RedisClientType } from 'redis'
import { StoragePipelineService } from './storage-pipline.service'

// Note: Assurez-vous que 'redis' (node-redis) est installé.
// npm install redis

// Les scripts Lua restent les mêmes, mais la façon de les appeler change.
const LUA_SCRIPTS = {
    INCREMENT: `
        local key = KEYS[1]
        local ttlMs = tonumber(ARGV[1])
        local newValue = redis.call('INCR', key)
        if newValue == 1 and ttlMs > 0 then
            redis.call('PEXPIRE', key, ttlMs)
        end
        return tostring(newValue)
    `,
    INCREMENT_IF: `
        local key = KEYS[1]
        local maxValue = tonumber(ARGV[1])
        local ttlMs = tonumber(ARGV[2])
        local currentValue = tonumber(redis.call('GET', key) or '0')
        if currentValue < maxValue then
            local newValue = currentValue + 1
            redis.call('SET', key, tostring(newValue))
            if currentValue == 0 and ttlMs > 0 then
                redis.call('PEXPIRE', key, ttlMs)
            end
            return {tostring(newValue), 1} -- { new value, incremented (true) }
        else
            return {tostring(currentValue), 0} -- { current value, incremented (false) }
        end
    `,
    DECREMENT: `
        local key = KEYS[1]
        local minValue = tonumber(ARGV[1])
        local currentValue = tonumber(redis.call('GET', key) or '0')
        local newValue = math.max(minValue, currentValue - 1)
        if newValue <= minValue then
            redis.call('DEL', key)
            return tostring(minValue)
        else
            redis.call('SET', key, tostring(newValue))
            return tostring(newValue)
        end
    `,
}

export class StorageService implements Storage {
    constructor(private client: RedisClientType) {}

    private getKey(key: string): string {
        // Un préfixe pourrait être géré ici, par exemple:
        // return `ratelock:${key}`;
        return key
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(this.getKey(key))
    }

    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        const fullKey = this.getKey(key)
        if (ttlMs && ttlMs > 0) {
            await this.client.set(fullKey, value, { PX: ttlMs })
        } else {
            await this.client.set(fullKey, value)
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(this.getKey(key))
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(this.getKey(key))
        return result === 1
    }

    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        await this.client.pExpire(this.getKey(keyOrIdentifier), ttlMs)
    }

    async increment(key: string, ttlMs?: number): Promise<number> {
        const result = await this.client.eval(LUA_SCRIPTS.INCREMENT, {
            keys: [this.getKey(key)],
            arguments: [ttlMs?.toString() ?? '0'],
        })
        return parseInt(result as string, 10)
    }

    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number,
    ): Promise<{ value: number; incremented: boolean }> {
        const result = (await this.client.eval(LUA_SCRIPTS.INCREMENT_IF, {
            keys: [this.getKey(key)],
            arguments: [maxValue.toString(), ttlMs?.toString() ?? '0'],
        })) as [string, number]

        return {
            value: parseInt(result[0], 10),
            incremented: result[1] === 1,
        }
    }

    async decrement(key: string, minValue: number = 0): Promise<number> {
        const result = await this.client.eval(LUA_SCRIPTS.DECREMENT, {
            keys: [this.getKey(key)],
            arguments: [minValue.toString()],
        })
        return parseInt(result as string, 10)
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        const fullKey = this.getKey(identifier)
        await this.client.zAdd(fullKey, { score: timestamp, value: timestamp.toString() })
        if (ttlMs > 0) {
            await this.expire(identifier, ttlMs)
        }
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const now = Date.now()
        const windowStart = now - windowMs
        return this.client.zCount(this.getKey(identifier), windowStart, now)
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const result = await this.client.zRangeWithScores(this.getKey(identifier), 0, 0)
        if (result.length > 0 && result[0]) {
            return result[0].score
        }
        return null
    }

    async cleanupTimestamps(_identifier: string): Promise<void> {
        // Cette méthode est plus complexe à implémenter sans connaître la stratégie de TTL exacte.
        // Pour l'instant, on ne fait rien, car Redis gère l'expiration des clés entières.
        // Si les timestamps doivent être nettoyés individuellement, une logique de ZREMRANGEBYSCORE serait nécessaire.
        Promise.resolve()
    }

    async multiGet(keys: string[]): Promise<(string | null)[]> {
        if (keys.length === 0) return []
        return this.client.mGet(keys.map(k => this.getKey(k)))
    }

    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        if (entries.length === 0) return

        const multi = this.client.multi()
        for (const { key, value, ttlMs } of entries) {
            const fullKey = this.getKey(key)
            if (ttlMs && ttlMs > 0) {
                multi.set(fullKey, value, { PX: ttlMs })
            } else {
                multi.set(fullKey, value)
            }
        }
        await multi.exec()
    }

    pipeline(): StoragePipeline {
        // Le pipeline de node-redis est transactionnel par défaut (multi).
        // Il est utilisé ici pour batcher les commandes.
        return new StoragePipelineService(this.client.multi())
    }
}
