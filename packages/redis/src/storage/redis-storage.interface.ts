import type { Storage } from '@ratelock/core/storage'

export interface RedisStorage extends Storage {
    evalScript(script: string, options: { keys: string[]; arguments: string[] }): Promise<any>
    scriptLoad(script: string): Promise<string>
    evalSha(sha: string, options: { keys: string[]; arguments: string[] }): Promise<any>
}
