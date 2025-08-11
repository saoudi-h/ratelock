export interface StrategyMetadata {
    readonly name: string
    readonly version?: string
    readonly memoryEfficient: boolean
    readonly supportsBatch: boolean
}

export interface StrategyStats {
    totalChecks: number
    allowedChecks: number
    deniedChecks: number
    averageResponseTime: number
    memoryUsage?: number
    activeIdentifiers?: number
}

export interface BaseStrategyOptions {
    prefix?: string
    enableStats?: boolean
    cleanupInterval?: number
}
