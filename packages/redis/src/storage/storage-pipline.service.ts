import type { StoragePipeline } from '@ratelock/core/storage'

// Le type RedisClientMultiCommand n'est pas exporté directement par la librairie redis.
// Nous utilisons `any` pour éviter des imports profonds et fragiles.
// Idéalement, ce type serait inféré ou un type plus générique serait utilisé.
type RedisClientMultiCommand = any;

// Ce service encapsule une transaction 'multi' de node-redis.
export class StoragePipelineService implements StoragePipeline {
    // Le type RedisClientMultiCommand correspond à l'objet retourné par client.multi()
    constructor(private multi: RedisClientMultiCommand) {}

    // Note: Les méthodes de l'interface qui ne sont pas directement supportées
    // par `node-redis` `multi` (comme nos scripts Lua) ne sont pas implémentées ici.
    // L'interface `StoragePipeline` devrait peut-être être simplifiée si
    // toutes les méthodes ne sont pas "pipelinables" de la même manière.
    // Pour l'instant, on implémente ce qui est directement possible.

    get(key: string): Promise<this> {
        this.multi.get(key)
        return Promise.resolve(this)
    }

    set(key: string, value: string, ttlMs?: number | undefined): Promise<this> {
        if (ttlMs && ttlMs > 0) {
            this.multi.set(key, value, { PX: ttlMs })
        } else {
            this.multi.set(key, value)
        }
        return Promise.resolve(this)
    }

    expire(keyOrIdentifier: string, ttlMs: number): Promise<this> {
        this.multi.pExpire(keyOrIdentifier, ttlMs)
        return Promise.resolve(this)
    }

    increment(_key: string, _ttlMs?: number): Promise<this> {
        // L'exécution de scripts Lua dans un pipeline `multi` est complexe.
        // Pour garder les choses simples, nous n'implémentons pas les commandes
        // basées sur LUA dans le pipeline pour le moment.
        console.warn('Pipelining custom LUA scripts like "increment" is not supported in this version.')
        return Promise.resolve(this)
    }
    incrementIf(_key: string, _maxValue: number, _ttlMs?: number): Promise<this> {
        console.warn('Pipelining custom LUA scripts like "incrementIf" is not supported in this version.')
        return Promise.resolve(this)
    }
    decrement(_key: string, _minValue?: number): Promise<this> {
        console.warn('Pipelining custom LUA scripts like "decrement" is not supported in this version.')
        return Promise.resolve(this)
    }
    addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<this> {
        this.multi.zAdd(identifier, { score: timestamp, value: timestamp.toString() })
        if (ttlMs > 0) {
            this.multi.pExpire(identifier, ttlMs)
        }
        return Promise.resolve(this)
    }
    countTimestamps(identifier: string, windowMs: number): Promise<this> {
        const now = Date.now()
        const windowStart = now - windowMs
        this.multi.zCount(identifier, windowStart, now)
        return Promise.resolve(this)
    }
    getOldestTimestamp(identifier: string): Promise<this> {
        this.multi.zRangeWithScores(identifier, 0, 0)
        return Promise.resolve(this)
    }

    async exec(): Promise<unknown[]> {
        // Exécute la transaction et retourne les résultats
        return this.multi.exec()
    }
}
