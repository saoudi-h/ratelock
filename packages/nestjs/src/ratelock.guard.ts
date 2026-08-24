import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { BaseResult, Limiter } from '@ratelock/core'
import { collectRateLimitHeaders, projectResult } from '@ratelock/http-common'

import type { RatelockModuleOptions } from './options'
import type { PlatformRequest } from './platform'
import { RATELOCK_OPTIONS, RATELOCK_RESOLVER, SKIP_RATE_LIMIT } from './tokens'

function applyHeaders(res: unknown, headers: Record<string, string>): void {
    const target = res as {
        setHeader?: (n: string, v: string) => unknown
        header?: (n: string, v: string) => unknown
    }
    if (typeof target.setHeader === 'function') {
        // Express Response
        for (const [name, value] of Object.entries(headers)) target.setHeader(name, value)
        return
    }
    if (typeof target.header === 'function') {
        // Fastify Reply
        for (const [name, value] of Object.entries(headers)) target.header(name, value)
    }
}

@Injectable()
export class RatelockGuard implements CanActivate {
    private readonly options: RatelockModuleOptions

    constructor(
        @Inject(RATELOCK_RESOLVER)
        private readonly resolveLimiter: () => Promise<Limiter<BaseResult>>,
        @Inject(RATELOCK_OPTIONS) options: RatelockModuleOptions,
        @Inject(Reflector) private readonly reflector: Reflector
    ) {
        this.options = options
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp()
        const request = http.getRequest<PlatformRequest>()
        const response = http.getResponse()

        if (
            this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT, [
                context.getHandler(),
                context.getClass(),
            ])
        ) {
            return true
        }

        const limiter = await this.resolveLimiter()
        const id = await this.resolveKey(request)
        const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

        const info = projectResult(result)
        const mode = this.options.headers === undefined ? ('both' as const) : this.options.headers
        applyHeaders(response, collectRateLimitHeaders(info, mode, this.options.limit))

        if (!result.allowed) {
            const status = this.options.denyStatusCode ?? HttpStatus.TOO_MANY_REQUESTS
            if (info.resetSeconds != null) {
                applyHeaders(response, { 'Retry-After': String(info.resetSeconds) })
            }
            throw new HttpException({ error: this.options.message ?? 'Too Many Requests' }, status)
        }

        return true
    }

    private async resolveKey(request: PlatformRequest): Promise<string> {
        const custom = this.options.keyGenerator
        if (custom) return custom(request as never)
        return request.ip ?? 'anonymous'
    }
}
