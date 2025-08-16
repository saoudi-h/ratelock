import type { BackendConfig } from '@/simulation/services/backends'

/**
 * Resolves backend configuration based on environment variables
 * @returns {BackendConfig} Configuration object for either local or API backend
 */
export function getBackendConfig(): BackendConfig {
    const backendMode = process.env.NEXT_PUBLIC_BACKEND_MODE || 'api'
    switch (backendMode) {
        case 'local':
            return {
                type: 'local',
                local: {},
            }
        case 'api':
        default:
            return {
                type: 'api',
                api: {
                    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
                    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
                },
            }
    }
}

/**
 * Checks if running in demo mode (local backend)
 * @returns {boolean} True when using local backend
 */
export function isDemoMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND_MODE === 'local'
}

/**
 * Checks if running in development mode (API backend)
 * @returns {boolean} True when using API backend
 */
export function isDevMode(): boolean {
    return process.env.NEXT_PUBLIC_BACKEND_MODE !== 'local'
}

export const UI_CONFIG = {
    showRedisOptions: isDevMode(),
    showPerformanceWarnings: isDemoMode(),
    maxConcurrentRequests: isDemoMode() ? 10 : 100,
    maxTestDuration: isDemoMode() ? 30000 : 300000,
}
