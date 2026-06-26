import { describe, expect, it } from 'vitest'
import { withCircuitBreaker } from '../src/circuit-breaker'
import { CircuitBreakerOpenError } from '../src/errors'
import type { Limiter } from '../src/types'

describe('withCircuitBreaker', () => {
    it('opens after threshold failures and recovers after timeout', async () => {
        let fails = true
        const mockLimiter: Limiter<any> = {
            check: async () => {
                if (fails) throw new Error('simulated failure')
                return { allowed: true }
            },
            checkBatch: async () => [],
        }

        const cb = withCircuitBreaker(mockLimiter, {
            failureThreshold: 2,
            recoveryTimeoutMs: 100,
        })

        // 1st failure
        await expect(cb.check('1')).rejects.toThrow('simulated failure')
        // 2nd failure triggers OPEN
        await expect(cb.check('1')).rejects.toThrow('simulated failure')

        // 3rd attempt is immediately rejected without calling mockLimiter
        await expect(cb.check('1')).rejects.toThrow(CircuitBreakerOpenError)

        // Wait for recovery timeout
        await new Promise(r => setTimeout(r, 150))

        // Probe request (should succeed now)
        fails = false
        const res = await cb.check('1')
        expect(res.allowed).toBe(true)

        // Circuit is now CLOSED again
        const res2 = await cb.check('1')
        expect(res2.allowed).toBe(true)
    })

    it('blocks concurrent requests during half-open probe', async () => {
        let resolveProbe: () => void
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw new Error('fail')
            },
            checkBatch: async () => [],
        }

        const cb = withCircuitBreaker(mockLimiter, { failureThreshold: 1, recoveryTimeoutMs: 50 })
        await expect(cb.check('1')).rejects.toThrow('fail') // Circuit is OPEN

        await new Promise(r => setTimeout(r, 60)) // wait for timeout

        mockLimiter.check = async () => {
            return new Promise(r => {
                resolveProbe = () => r({ allowed: true })
            })
        }

        // Start probe
        const probePromise = cb.check('1')

        // Concurrent request should be denied because probe is inflight
        await expect(cb.check('2')).rejects.toThrow(CircuitBreakerOpenError)

        resolveProbe!()
        await probePromise

        // Probe succeeded, circuit is closed
        mockLimiter.check = async () => ({ allowed: true })
        await expect(cb.check('3')).resolves.toEqual({ allowed: true })
    })

    it('resets failure count on success', async () => {
        let fails = true
        const mockLimiter: Limiter<any> = {
            check: async () => {
                if (fails) throw new Error('fail')
                return { allowed: true }
            },
            checkBatch: async () => [],
        }
        const cb = withCircuitBreaker(mockLimiter, { failureThreshold: 2, recoveryTimeoutMs: 100 })

        await expect(cb.check('1')).rejects.toThrow('fail') // 1 failure
        fails = false
        await cb.check('1') // success, failureCount should be 0

        fails = true
        await expect(cb.check('1')).rejects.toThrow('fail') // 1 failure again
        await expect(cb.check('1')).rejects.toThrow('fail') // 2 failures -> OPEN

        await expect(cb.check('1')).rejects.toThrow(CircuitBreakerOpenError)
    })

    it('preserves original error as cause when circuit is open', async () => {
        const original = new Error('connection refused')
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw original
            },
            checkBatch: async () => [],
        }
        const cb = withCircuitBreaker(mockLimiter, {
            failureThreshold: 1,
            recoveryTimeoutMs: 60_000,
        })

        await expect(cb.check('1')).rejects.toThrow('connection refused')

        try {
            await cb.check('1')
            expect.fail('should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(CircuitBreakerOpenError)
            expect((err as Error & { cause: unknown }).cause).toBe(original)
        }
    })

    it('uses default recoveryTimeoutMs when not provided', async () => {
        const mockLimiter: Limiter<any> = {
            check: async () => {
                throw new Error('fail')
            },
            checkBatch: async () => [],
        }
        const cb = withCircuitBreaker(mockLimiter, { failureThreshold: 1 })

        await expect(cb.check('1')).rejects.toThrow('fail')
        await expect(cb.check('1')).rejects.toThrow(CircuitBreakerOpenError)
    })
})
