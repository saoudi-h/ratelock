import type { PgDriver } from './drivers/types'

const SCHEMA = 'ratelock'

export async function runMigrations(
    driver: PgDriver,
    options?: { unlogged?: boolean }
): Promise<void> {
    const tablePrefix = options?.unlogged ? 'UNLOGGED TABLE' : 'TABLE'
    await driver.query('BEGIN')
    try {
        await driver.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`)

        await driver.query(`
        CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.fixed_window (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `)

        // v0.2: sliding-window is now log-based (one row per request timestamp),
        // matching @ratelock/redis ZSET and @ratelock/local Map semantics.
        // Migrate from the legacy counter-based schema if it exists.
        try {
            const cols = await driver.query<{ column_name: string }>(
                `SELECT column_name FROM information_schema.columns
           WHERE table_schema = '${SCHEMA}' AND table_name = 'sliding_window'`
            )
            if (cols.length > 0 && !cols.some(c => c.column_name === 'ts')) {
                // Legacy counter-based table (had current_count/previous_count/window_start)
                await driver.query(`DROP TABLE IF EXISTS ${SCHEMA}.sliding_window CASCADE`)
            }
        } catch {
            // ignore — table doesn't exist yet
        }

        // Drop the old expires_at index from the counter-based schema; the
        // new index is (key, ts). SAFE because of IF EXISTS — no-op on fresh
        // installs, and the table was just dropped in the legacy branch.
        await driver.query(`DROP INDEX IF EXISTS ${SCHEMA}.idx_sliding_window_expires_at`)

        await driver.query(`
        CREATE ${tablePrefix} IF NOT EXISTS ${SCHEMA}.sliding_window (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          key TEXT NOT NULL,
          ts TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `)

        await driver.query(`
        CREATE INDEX IF NOT EXISTS idx_sliding_window_key_ts
        ON ${SCHEMA}.sliding_window (key, ts)
      `)

        // Migrate last_refill from TIMESTAMPTZ to DOUBLE PRECISION (v0.1 → v0.2)
        // Only runs if the column type is wrong - safe for repeated execution
        try {
            const cols = await driver.query<{ data_type: string }>(
                `SELECT data_type FROM information_schema.columns
           WHERE table_schema = '${SCHEMA}' AND table_name = 'token_bucket' AND column_name = 'last_refill'`
            )
            if (cols.length > 0 && cols[0]!.data_type !== 'double precision') {
                // Legacy table has TIMESTAMPTZ - rebuild it
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
        await driver.query('COMMIT')
    } catch (err) {
        await driver.query('ROLLBACK')
        throw err
    }
}
