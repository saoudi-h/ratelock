import { describe, expect, it } from 'vitest'
import { adaptClient, createConnection } from '../src/client'

/** Minimal stand-in for Bun's native RedisClient: send()-only surface. */
class FakeBunRedis {
    sent: Array<{ cmd: string; args: string[] }> = []
    store = new Map<string, string>()

    async send(command: string, args: string[]): Promise<unknown> {
        this.sent.push({ cmd: command, args })
        switch (command) {
            case 'SET': {
                this.store.set(args[0]!, args[1]!)
                return 'OK'
            }
            case 'SCRIPT':
                return 'abc123'
            case 'EVAL':
            case 'EVALSHA':
                return [1, 2, 3]
            default:
                return 'OK'
        }
    }

    async get(key: string): Promise<string | null> {
        return this.store.get(key) ?? null
    }

    async del(...keys: string[]): Promise<number> {
        this.sent.push({ cmd: 'DEL', args: [...keys] })
        let n = 0
        for (const k of keys) {
            if (this.store.delete(k)) n++
        }
        return n
    }
}

describe('bun driver detection', () => {
    it('detects a send()-based client as bun', () => {
        const adapted = adaptClient(new FakeBunRedis())
        expect(adapted).toBeDefined()
    })

    it('rejects unrecognized clients', () => {
        expect(() => adaptClient({ foo: 1 })).toThrow(/Unrecognized Redis client/)
    })

    it('still detects node-redis and ioredis shapes', () => {
        expect(() => adaptClient({ isOpen: true, ping: async () => 'PONG' })).not.toThrow()
        expect(() =>
            adaptClient({ status: 'ready', connector: {}, multi: () => ({}) })
        ).not.toThrow()
    })
})

describe('bun driver adapter mapping', () => {
    it('maps eval to EVAL with key count', async () => {
        const fake = new FakeBunRedis()
        const client = adaptClient(fake)
        await client.eval('return 1', ['k1', 'k2'], ['a', 'b'])
        expect(fake.sent[0]).toEqual({ cmd: 'EVAL', args: ['return 1', '2', 'k1', 'k2', 'a', 'b'] })
    })

    it('maps evalsha to EVALSHA with key count', async () => {
        const fake = new FakeBunRedis()
        const client = adaptClient(fake)
        const res = await client.evalsha('sha', ['k1'], ['10'])
        expect(res).toEqual([1, 2, 3])
        expect(fake.sent[0]).toEqual({ cmd: 'EVALSHA', args: ['sha', '1', 'k1', '10'] })
    })

    it('maps loadScript to SCRIPT LOAD', async () => {
        const fake = new FakeBunRedis()
        const sha = await adaptClient(fake).loadScript('return 1')
        expect(sha).toBe('abc123')
        expect(fake.sent[0]).toEqual({ cmd: 'SCRIPT', args: ['LOAD', 'return 1'] })
    })

    it('maps set with PX ttl', async () => {
        const fake = new FakeBunRedis()
        await adaptClient(fake).set('k', 'v', 5000)
        expect(fake.sent[0]).toEqual({ cmd: 'SET', args: ['k', 'v', 'PX', '5000'] })
    })

    it('maps del with spread keys', async () => {
        const fake = new FakeBunRedis()
        await fake.send('SET', ['a', '1'])
        await fake.send('SET', ['b', '2'])
        const n = await adaptClient(fake).del('a', 'b')
        expect(n).toBe(2)
    })

    it('returns 0 for empty del without touching the client', async () => {
        const fake = new FakeBunRedis()
        const before = fake.sent.length
        const n = await adaptClient(fake).del()
        expect(n).toBe(0)
        expect(fake.sent.length).toBe(before)
    })

    it('maps pExpire to PEXPIRE', async () => {
        const fake = new FakeBunRedis()
        await adaptClient(fake).pExpire('k', 250)
        expect(fake.sent[0]).toEqual({ cmd: 'PEXPIRE', args: ['k', '250'] })
    })
})

describe('bun driver batch (multi/pipeline)', () => {
    it('queues commands and resolves in order on exec', async () => {
        const fake = new FakeBunRedis()
        const client = adaptClient(fake)
        const batch = client.multi()
        batch.set('k', 'v', 1000)
        batch.get('k')
        batch.del('k')
        batch.evalsha('sha', ['x'], ['1'])
        const results = await batch.exec()
        expect(results).toEqual(['OK', 'v', 1, [1, 2, 3]])
        expect(fake.sent.map(s => s.cmd)).toEqual(['SET', 'DEL', 'EVALSHA'])
    })

    it('pipeline exposes eval/evalsha and drains the queue per exec', async () => {
        const fake = new FakeBunRedis()
        const client = adaptClient(fake)
        const p = client.pipeline()
        p.evalsha('s1', ['k'], ['1'])
        p.eval('return 2', ['k'], ['2'])
        await p.exec()
        expect(fake.sent.map(s => s.cmd)).toEqual(['EVALSHA', 'EVAL'])

        p.evalsha('s2', ['k'], ['3'])
        await p.exec()
        expect(fake.sent.length).toBe(3)
        expect(fake.sent[2]!.cmd).toBe('EVALSHA')
    })

    it('skips empty del inside batches but keeps result alignment', async () => {
        const fake = new FakeBunRedis()
        const client = adaptClient(fake)
        const batch = client.pipeline()
        batch.del()
        batch.set('k', 'v', 100)
        const results = await batch.exec()
        expect(results).toEqual(['OK'])
    })
})

describe('createConnection error guidance', () => {
    it('lists the bun option when neither client nor url is provided', async () => {
        await expect(createConnection({})).rejects.toThrow(/driver: "bun"/)
    })

    it('fails clearly when bun driver requested outside Bun runtime', async () => {
        // vitest runs under Node; import('bun') must fail there
        await expect(
            createConnection({ url: 'redis://localhost:6379', driver: 'bun' })
        ).rejects.toThrow(/requires the Bun runtime/)
    })
})
