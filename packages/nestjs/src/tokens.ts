import { SetMetadata } from '@nestjs/common'

/**
 * Injection token for the memoized limiter resolver created from module
 * options. Resolves to the `Limiter` instance on first call.
 */
export const RATELOCK_RESOLVER = 'RATELOCK_RESOLVER'

/** Injection token for the normalized module options. */
export const RATELOCK_OPTIONS = 'RATELOCK_OPTIONS'

/** Metadata key marking routes that bypass rate limiting. */
export const SKIP_RATE_LIMIT = 'SKIP_RATE_LIMIT'

/**
 * Marks a route (method) or controller (class) as exempt from rate limiting.
 * Checked with `Reflector.getAllAndOverride`, so a method-level decorator
 * wins over a controller-level one.
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT, true)
