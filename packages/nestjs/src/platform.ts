import type { BaseResult } from '@ratelock/core'

/**
 * Adapter-neutral subset of the platform request object. Both the Express
 * (`req.ip`, `res.setHeader`) and Fastify (`request.ip`, `reply.header`)
 * wrappers satisfy it, which keeps the guard usable with either adapter.
 */
export interface PlatformRequest {
    ip?: string
    headers: Record<string, string | string[] | undefined>
}

export interface BaseResultLike extends BaseResult {
    [key: string]: unknown
}
