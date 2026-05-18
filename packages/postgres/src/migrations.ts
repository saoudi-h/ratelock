import type { PgDriver } from './drivers/types'

const SCHEMA = 'ratelock'

export async function runMigrations(driver: PgDriver, options?: { unlogged?: boolean }): Promise<void> {
  const tablePrefix = options?.unlogged ? 'UNLOGGED TABLE' : 'TABLE'
  await driver.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`)

  await driver.query(`
    CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.fixed_window (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `)

  await driver.query(`
    CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.sliding_window (
      key TEXT PRIMARY KEY,
      current_count INTEGER NOT NULL DEFAULT 0,
      previous_count INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `)

  try {
    // Migrate last_refill from TIMESTAMPTZ to DOUBLE PRECISION by dropping the legacy table in v0.2.0
    await driver.query(`DROP TABLE IF EXISTS ${SCHEMA}.token_bucket CASCADE`)
  } catch {
    // Table might not exist, ignore error safely
  }

  await driver.query(`
    CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.token_bucket (
      key TEXT PRIMARY KEY,
      tokens DOUBLE PRECISION NOT NULL,
      last_refill DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()),
      capacity INTEGER NOT NULL,
      refill_rate DOUBLE PRECISION NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `)

  await driver.query(`
    CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.individual_fixed_window (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `)

  await driver.query(`
    CREATE INDEX IF NOT EXISTS idx_fixed_window_expires_at
    ON ${SCHEMA}.fixed_window (expires_at)
    WHERE expires_at IS NOT NULL
  `)

  await driver.query(`
    CREATE INDEX IF NOT EXISTS idx_sliding_window_expires_at
    ON ${SCHEMA}.sliding_window (expires_at)
    WHERE expires_at IS NOT NULL
  `)

  await driver.query(`
    CREATE INDEX IF NOT EXISTS idx_token_bucket_expires_at
    ON ${SCHEMA}.token_bucket (expires_at)
    WHERE expires_at IS NOT NULL
  `)

  await driver.query(`
    CREATE INDEX IF NOT EXISTS idx_individual_fixed_window_expires_at
    ON ${SCHEMA}.individual_fixed_window (expires_at)
    WHERE expires_at IS NOT NULL
  `)
}
