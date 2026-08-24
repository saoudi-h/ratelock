import { Module, type DynamicModule, type Provider, type Type } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { BaseResult } from '@ratelock/core'
import { createLimiterResolver } from '@ratelock/http-common'

import type { RatelockModuleOptions } from './options'
import { RatelockGuard } from './ratelock.guard'
import { RATELOCK_OPTIONS, RATELOCK_RESOLVER } from './tokens'

/**
 * Async registration options mirroring the standard NestJS
 * `forRootAsync({ imports, inject, useFactory })` shape. The factory resolves
 * the full module options, typically pulling configuration from an injected
 * `ConfigService`.
 */
export interface RatelockAsyncOptions {
    imports?: Array<Type<unknown> | DynamicModule>
    inject?: Array<Type<unknown> | string | symbol>
    useFactory: (...args: never[]) => RatelockModuleOptions | Promise<RatelockModuleOptions>
}

function buildProviders<T extends BaseResult>(optionsProvider: Provider): Provider[] {
    const resolverProvider: Provider = {
        provide: RATELOCK_RESOLVER,
        useFactory: (options: RatelockModuleOptions<T>) => createLimiterResolver(options.limiter),
        inject: [RATELOCK_OPTIONS],
    }
    // useClass instead of useExisting: APP_GUARD registrations inside dynamic
    // global modules fail to resolve useExisting targets while scanning
    // importer modules. The guard holds no state beyond the shared memoized
    // resolver, so two instances are harmless.
    return [
        optionsProvider,
        resolverProvider,
        RatelockGuard,
        { provide: APP_GUARD, useClass: RatelockGuard },
    ]
}

/**
 * NestJS dynamic module registering a RateLock guard backed by any engine.
 *
 * The module is global and, by default, binds the guard application-wide via
 * `APP_GUARD`. Routes and controllers opt out with `@SkipRateLimit()`.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     RatelockModule.forRoot({
 *       limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
 *       keyGenerator: req => req.ip ?? 'anon',
 *     }),
 *   ],
 * })
 * class AppModule {}
 * ```
 */
@Module({})
export class RatelockModule {
    static forRoot<T extends BaseResult>(options: RatelockModuleOptions<T>): DynamicModule {
        return {
            global: true,
            module: RatelockModule,
            providers: buildProviders<T>({ provide: RATELOCK_OPTIONS, useValue: options }),
            exports: [RatelockGuard],
        }
    }

    static forRootAsync<T extends BaseResult>(asyncOptions: RatelockAsyncOptions): DynamicModule {
        return {
            global: true,
            module: RatelockModule,
            imports: asyncOptions.imports ?? [],
            providers: buildProviders<T>({
                provide: RATELOCK_OPTIONS,
                useFactory: asyncOptions.useFactory as (
                    ...args: unknown[]
                ) => RatelockModuleOptions<T>,
                inject: asyncOptions.inject ?? [],
            }),
            exports: [RatelockGuard],
        }
    }
}
