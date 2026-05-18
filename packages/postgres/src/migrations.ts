import type { PgDriver } from './drivers/types'

const SCHEMA = 'ratelock'

export async function runMigrations(
    driver: PgDriver,
    options?: { unlogged?: boolean }
): Promise<void> {
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

    // Migrate last_refill from TIMESTAMPTZ to DOUBLE PRECISION (v0.1 → v0.2)
    // Only runs if the column type is wrong — safe for repeated execution
    try {
        const cols = await driver.query<{ data_type: string }>(
            `SELECT data_type FROM information_schema.columns
       WHERE table_schema = '${SCHEMA}' AND table_name = 'token_bucket' AND column_name = 'last_refill'`
        )
        if (cols.length > 0 && cols[0]!.data_type !== 'double precision') {
            // Legacy table has TIMESTAMPTZ — rebuild it
            await driver.query(`DROP TABLE IF EXISTS ${SCHEMA}.token_bucket CASCADE`)
        }
    } catch {
        // Table might not exist yet, safe to continue
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
