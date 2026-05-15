import type { PgDriver } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postgresDriver(sql: any): PgDriver {
  return {
    async query<T = unknown>(sqlString: string, params?: unknown[]): Promise<T[]> {
      const values = params ?? []
      const parts = sqlString.split(/\$(\d+)/g)
      const strings: string[] = [parts[0]!]
      const indices: number[] = []

      for (let i = 1; i < parts.length; i += 2) {
        const idx = parseInt(parts[i]!, 10) - 1
        indices.push(idx)
        strings.push(parts[i + 1] ?? '')
      }

      const raw = [...strings]
      const tpl = Object.assign(strings as unknown as object, { raw }) as unknown as TemplateStringsArray
      const taggedValues = indices.map((idx) => values[idx])
      const result = await sql(tpl, ...taggedValues)
      return result as T[]
    },
    end() {
      return sql.end()
    },
  }
}
