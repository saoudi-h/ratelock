/**
 * Custom error types for Redis storage
 */

export class RedisStorageError extends Error {
  public readonly code: string | undefined;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    options?: {
      code?: string
      cause?: unknown
      details?: Record<string, unknown>
    }
  ) {
    super(message)
    this.name = 'RedisStorageError'
    this.code = options?.code
    this.cause = options?.cause
    this.details = options?.details

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RedisStorageError)
    }
  }

  static isRedisStorageError(error: unknown): error is RedisStorageError {
    return error instanceof RedisStorageError
  }

  static fromError(error: unknown, context?: string): RedisStorageError {
    if (error instanceof RedisStorageError) {
      return error
    }

    const message = context ? `${context}: ${String(error)}` : String(error)
    return new RedisStorageError(message, { cause: error })
  }
}

export class RedisConnectionError extends RedisStorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: 'REDIS_CONNECTION_ERROR', ...options })
    this.name = 'RedisConnectionError'
  }
}

export class RedisTimeoutError extends RedisStorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: 'REDIS_TIMEOUT_ERROR', ...options })
    this.name = 'RedisTimeoutError'
  }
}

export class RedisScriptError extends RedisStorageError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: 'REDIS_SCRIPT_ERROR', ...options })
    this.name = 'RedisScriptError'
  }
}