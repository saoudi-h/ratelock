import type { RedisScriptClient } from './types'

type ScriptCall = {
    keys: string[]
    args: string[]
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message)
    }
    return String(error)
}

function isNoScriptError(error: unknown): boolean {
    return errorMessage(error).toUpperCase().includes('NOSCRIPT')
}

/** Keeps script loading and NOSCRIPT recovery identical across Redis transports. */
export function createScriptRunner(client: RedisScriptClient, script: string) {
    let scriptSha: string | null = null

    async function ensureScript(): Promise<string> {
        if (!scriptSha) scriptSha = await client.loadScript(script)
        return scriptSha
    }

    async function execute({ keys, args }: ScriptCall): Promise<unknown> {
        const sha = await ensureScript()

        try {
            return await client.evalsha(sha, keys, args)
        } catch (error) {
            if (!isNoScriptError(error)) throw error

            const refreshedSha = await client.loadScript(script)
            scriptSha = refreshedSha
            return client.evalsha(refreshedSha, keys, args)
        }
    }

    async function executeBatch(calls: ScriptCall[]): Promise<unknown[]> {
        if (calls.length === 0) return []

        const sha = await ensureScript()
        const pipeline = client.pipeline()

        for (const call of calls) pipeline.evalsha(sha, call.keys, call.args)

        try {
            return await pipeline.exec()
        } catch (error) {
            if (!isNoScriptError(error)) throw error

            const refreshedSha = await client.loadScript(script)
            scriptSha = refreshedSha
            const retryPipeline = client.pipeline()

            for (const call of calls) {
                retryPipeline.evalsha(refreshedSha, call.keys, call.args)
            }

            return retryPipeline.exec()
        }
    }

    return { execute, executeBatch }
}
