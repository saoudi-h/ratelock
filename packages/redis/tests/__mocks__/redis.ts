import { vi } from 'vitest'

const createMockRedisClient = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    isOpen: true,
    on: vi.fn(),
    eval: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    pTTL: vi.fn(),
    pExpire: vi.fn(),
    keys: vi.fn(),
    type: vi.fn(),
    zCard: vi.fn(),
    hGet: vi.fn(),
    ping: vi.fn(),
    quit: vi.fn(),
    script: vi.fn(),
    multi: vi.fn(() => ({
        get: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        eval: vi.fn().mockReturnThis(),
        exec: vi.fn(),
    })),
})

export const createClient = vi.fn(createMockRedisClient)
export const mockClient = createMockRedisClient()
