# @ratelock/postgres

> PostgreSQL-backed rate limiting using UPSERTs and native SQL operations.

[![npm version](https://img.shields.io/npm/v/@ratelock/postgres.svg)](https://www.npmjs.com/package/@ratelock/postgres)
[![License](https://img.shields.io/npm/l/@ratelock/postgres.svg)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)

## When to Use

- Applications already running PostgreSQL
- When you want rate limiting without adding Redis to your stack
- When you need durable, persisted rate limit state
- When you benefit from PostgreSQL's ACID guarantees

## Installation

```bash
npm install @ratelock/postgres postgres
# or with pg
npm install @ratelock/postgres pg
```

## Quick Start

### With a Connection String

```typescript
import { fixedWindow } from '@ratelock/postgres'

const limiter = await fixedWindow({
    url: 'postgres://user:pass@localhost:5432/mydb',
    limit: 100,
    windowMs: 60_000,
})
```

### With an Existing Client (porsager/postgres)

```typescript
import postgres from 'postgres'
import { fixedWindow } from '@ratelock/postgres'

const sql = postgres('postgres://user:pass@localhost:5432/mydb')

const limiter = await fixedWindow({
    sql,
    limit: 100,
    windowMs: 60_000,
})
```

### With an Existing Pool (pg)

```typescript
import { Pool } from 'pg'
import { fixedWindow } from '@ratelock/postgres'

const pool = new Pool({ connectionString: 'postgres://user:pass@localhost:5432/mydb' })

const limiter = await fixedWindow({
    pool,
    limit: 100,
    windowMs: 60_000,
})
```

## Auto-Migrations

RateLock automatically creates its schema and tables on initialization. Skip this if you manage migrations yourself:

```typescript
const limiter = await fixedWindow({
    url: 'postgres://...',
    limit: 100,
    windowMs: 60_000,
    skipMigrations: true,
})
```

## Unlogged Tables

For better write performance (at the cost of crash safety), use unlogged tables:

```typescript
const limiter = await fixedWindow({
    url: 'postgres://...',
    limit: 100,
    windowMs: 60_000,
    unlogged: true,
})
```

## Built-in Resilience

```typescript
const limiter = await fixedWindow({
    url: 'postgres://...',
    limit: 100,
    windowMs: 60_000,
    cache: { maxSize: 1000, ttlMs: 30_000 },
    retry: { maxAttempts: 3 },
    circuitBreaker: { failureThreshold: 5 },
    fallback: 'allow',
})
```

## All Strategies

```typescript
import {
    fixedWindow,
    slidingWindow,
    tokenBucket,
    individualFixedWindow,
    createConnection,
    pgDriver,
    postgresDriver,
    runMigrations,
    cleanupExpired,
} from '@ratelock/postgres'
```

## Manual Cleanup

Expired rows are cleaned up automatically every 5 minutes. You can also trigger it manually:

```typescript
import { cleanupExpired } from '@ratelock/postgres'

const deletedCount = await cleanupExpired(driver)
```

## Cleanup

```typescript
await limiter.destroy() // Stops auto-cleanup and closes the connection
```

## Documentation

Full API reference and guides at **[ratelock.vercel.app](https://ratelock.vercel.app)**.

## License

[MIT](./LICENSE)
