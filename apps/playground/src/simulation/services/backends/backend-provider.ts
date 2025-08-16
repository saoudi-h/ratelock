import { getBackendConfig } from '@/simulation/config/backend'
import { ApiBackend } from './api-backend'
import { LocalBackend } from './local-backend'
import type { BackendConfig, RateLimitBackend } from './types'

/**
 * Singleton provider managing rate limiting backends
 * Handles switching between API and Local implementations based on configuration
 */
export class BackendProvider {
    private static instance: BackendProvider | null = null
    private backend: RateLimitBackend | null = null
    private config: BackendConfig | null = null

    private constructor() {}

    /**
     * Gets the singleton instance of the provider
     * @returns {BackendProvider} Existing or newly created instance
     */
    static getInstance(): BackendProvider {
        if (!BackendProvider.instance) {
            BackendProvider.instance = new BackendProvider()
        }
        return BackendProvider.instance
    }

    /**
     * Configures the backend to use
     * @param {BackendConfig} config - Backend configuration
     */
    configure(config: BackendConfig): void {
        if (this.config && JSON.stringify(this.config) !== JSON.stringify(config)) {
            this.cleanup()
        }
        this.config = config
        this.backend = this.createBackend(config)
    }

    /**
     * Gets the configured backend instance
     * @returns {RateLimitBackend} Configured backend
     * @throws {Error} If backend is not configured
     */
    getBackend(): RateLimitBackend {
        if (!this.backend) {
            throw new Error('Backend not configured. Call configure() first.')
        }
        return this.backend
    }

    /**
     * Gets the current configuration
     * @returns {BackendConfig | null} Current configuration or null if not configured
     */
    getConfig(): BackendConfig | null {
        return this.config
    }

    /**
     * Checks if a backend is configured
     * @returns {boolean} True if backend is configured
     */
    isConfigured(): boolean {
        return this.backend !== null
    }

    /**
     * Cleans up current backend resources
     */
    async cleanup(): Promise<void> {
        if (this.backend?.cleanup) {
            await this.backend.cleanup()
        }
        this.backend = null
        this.config = null
    }

    /**
     * Creates a backend instance based on configuration
     * @param {BackendConfig} config - Backend configuration
     * @returns {RateLimitBackend} New backend instance
     * @throws {Error} If backend type is unsupported
     */
    private createBackend(config: BackendConfig): RateLimitBackend {
        switch (config.type) {
            case 'api':
                return new ApiBackend(config.api)
            case 'local':
                return new LocalBackend()
            default:
                throw new Error(`Unsupported backend type: ${(config as any).type}`)
        }
    }

    /**
     * Resets the singleton (useful for testing)
     */
    static reset(): void {
        if (BackendProvider.instance?.backend?.cleanup) {
            BackendProvider.instance.backend.cleanup()
        }
        BackendProvider.instance = null
    }
}

/**
 * Initializes backend automatically with optional configuration
 * @param {BackendConfig} [config] - Optional configuration override
 * @returns {RateLimitBackend} Configured backend instance
 */
export function initializeBackend(config?: BackendConfig): RateLimitBackend {
    const provider = BackendProvider.getInstance()
    if (!provider.isConfigured()) {
        const finalConfig = config || getBackendConfig()
        provider.configure(finalConfig)
    }
    return provider.getBackend()
}

/**
 * Gets the configured backend, auto-initializing if needed
 * @returns {RateLimitBackend} Configured backend instance
 */
export function getBackend(): RateLimitBackend {
    const provider = BackendProvider.getInstance()
    if (!provider.isConfigured()) {
        const config = getBackendConfig()
        provider.configure(config)
    }
    return provider.getBackend()
}
