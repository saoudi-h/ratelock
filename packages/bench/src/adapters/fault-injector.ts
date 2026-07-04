import type IORedis from 'ioredis'

/**
 * Fault injection profile applied to a Redis client. The profile is a
 * declarative description of how the wrapped client should misbehave: drop
 * some calls, slow others, or refuse all of them. The wrapped client still
 * satisfies the ioredis API surface — it just sometimes throws or sleeps
 * before delegating to the real client.
 */
export interface FaultProfile {
    /** Human-readable label for reporting. */
    label: string
    /** 0..1, fraction of calls that throw a transient error. */
    transientErrorRate?: number
    /** Extra latency (ms) added before every call. */
    latencyMs?: number
    /** When true, every call throws. Equivalent to a hard outage. */
    hardDown?: boolean
}

export interface FaultStats {
    label: string
    totalCalls: number
    injectedErrors: number
    injectedLatency: number
}

const TRANSIENT_ERROR = () => new Error('Fault injector: transient error (injected)')

/**
 * Wraps a real ioredis client with fault injection. The wrapper is a Proxy:
 * it preserves the original prototype chain (and all properties `adaptClient`
 * looks at, like `connector` and `status`) and only intercepts the methods
 * that the limiter actually calls.
 *
 * Methods intercepted: eval, evalsha, loadScript, get, set, del, pExpire,
 * multi, pipeline, and the `exec` method on the multi/pipeline builders.
 * Every other method is forwarded as-is, so commands like `ping`, `quit`,
 * `disconnect` still work normally.
 */
export function wrapWithFaults(rawClient: IORedis, profile: FaultProfile): IORedis {
    const stats: FaultStats = {
        label: profile.label,
        totalCalls: 0,
        injectedErrors: 0,
        injectedLatency: 0,
    }

    const shouldInjectError = (): boolean => {
        if (profile.hardDown) return true
        if (profile.transientErrorRate && profile.transientErrorRate > 0) {
            return Math.random() < profile.transientErrorRate
        }
        return false
    }

    const waitForLatency = async (): Promise<void> => {
        if (profile.latencyMs && profile.latencyMs > 0) {
            await new Promise(resolve => setTimeout(resolve, profile.latencyMs))
            stats.injectedLatency += profile.latencyMs
        }
    }

    const guard = async <T>(fn: () => Promise<T>): Promise<T> => {
        stats.totalCalls++
        if (shouldInjectError()) {
            stats.injectedErrors++
            throw TRANSIENT_ERROR()
        }
        await waitForLatency()
        return fn()
    }

    return new Proxy(rawClient, {
        get(target, prop, receiver) {
            if (prop === 'faultStats') {
                return stats
            }

            if (prop === 'eval') {
                return (...args: unknown[]) => guard(() => (target as any).eval(...args))
            }
            if (prop === 'evalsha') {
                return (...args: unknown[]) => guard(() => (target as any).evalsha(...args))
            }
            if (prop === 'script') {
                // ioredis exposes `script('load', ...)` for SCRIPT LOAD
                return (...args: unknown[]) => guard(() => (target as any).script(...args))
            }
            if (prop === 'get') {
                return (...args: unknown[]) => guard(() => (target as any).get(...args))
            }
            if (prop === 'set') {
                return (...args: unknown[]) => guard(() => (target as any).set(...args))
            }
            if (prop === 'del') {
                return (...args: unknown[]) => guard(() => (target as any).del(...args))
            }
            if (prop === 'pExpire' || prop === 'pexpire') {
                return (...args: unknown[]) => guard(() => (target as any).pexpire(...args))
            }
            if (prop === 'multi') {
                return (...args: unknown[]) => {
                    const m = (target as any).multi(...args)
                    return wrapPipeline(m, stats, profile)
                }
            }
            if (prop === 'pipeline') {
                return (...args: unknown[]) => {
                    const p = (target as any).pipeline(...args)
                    return wrapPipeline(p, stats, profile)
                }
            }

            return Reflect.get(target, prop, receiver)
        },
    }) as unknown as IORedis
}

interface PipelineLike {
    eval(...args: unknown[]): unknown
    evalsha(...args: unknown[]): unknown
    evalSha(...args: unknown[]): unknown
    get(...args: unknown[]): unknown
    set(...args: unknown[]): unknown
    del(...args: unknown[]): unknown
    pExpire(...args: unknown[]): unknown
    pexpire(...args: unknown[]): unknown
    exec(): Promise<unknown[]>
}

/**
 * Wraps a multi/pipeline builder so every queued command respects the
 * fault profile. ioredis returns one result per queued command from `exec`;
 * we keep the same shape but convert the result for any command that was
 * "fired" (under fault) into an Error entry. Errors from `exec` propagate
 * like they do for a real failure, which is exactly what the limiter sees
 * when Redis itself is down.
 */
function wrapPipeline(p: PipelineLike, stats: FaultStats, profile: FaultProfile): PipelineLike {
    const queuedFaults: boolean[] = []

    const shouldInjectError = (): boolean => {
        if (profile.hardDown) return true
        if (profile.transientErrorRate && profile.transientErrorRate > 0) {
            return Math.random() < profile.transientErrorRate
        }
        return false
    }

    const waitForLatency = async (): Promise<void> => {
        if (profile.latencyMs && profile.latencyMs > 0) {
            await new Promise(resolve => setTimeout(resolve, profile.latencyMs))
            stats.injectedLatency += profile.latencyMs
        }
    }

    const queue = (fn: () => void) => {
        const inject = shouldInjectError()
        queuedFaults.push(inject)
        if (inject) {
            // Skip queueing; we'll synthesize an error in `exec`.
            return
        }
        fn()
    }

    return {
        eval(...args: unknown[]) {
            queue(() => p.eval(...(args as [])))
        },
        evalsha(...args: unknown[]) {
            queue(() => p.evalsha(...(args as [])))
        },
        evalSha(...args: unknown[]) {
            queue(() => p.evalSha(...(args as [])))
        },
        get(...args: unknown[]) {
            queue(() => p.get(...(args as [])))
        },
        set(...args: unknown[]) {
            queue(() => p.set(...(args as [])))
        },
        del(...args: unknown[]) {
            queue(() => p.del(...(args as [])))
        },
        pExpire(...args: unknown[]) {
            queue(() => p.pExpire(...(args as [])))
        },
        pexpire(...args: unknown[]) {
            queue(() => p.pexpire(...(args as [])))
        },
        async exec(): Promise<unknown[]> {
            // Apply latency once per pipeline execution, not per command.
            await waitForLatency()
            stats.totalCalls += queuedFaults.length || 1

            if (queuedFaults.some(inject => inject)) {
                // First injected command short-circuits the whole pipeline
                // the same way a Redis crash mid-pipeline would. We reflect
                // this in the per-call counter and re-throw.
                stats.injectedErrors += queuedFaults.length
                throw TRANSIENT_ERROR()
            }

            return p.exec()
        },
    }
}
