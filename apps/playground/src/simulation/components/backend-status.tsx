'use client'
import { DiagonalLinesBackground } from '@/components/blocks/DiagonalLinesBackground'
import { Section } from '@/components/blocks/Section'
import { getBackendConfig } from '@/simulation/config/backend'
import { BackendProvider } from '@/simulation/services/backends'
import { useEffect, useState, useSyncExternalStore } from 'react'

interface BackendStatusProps {
    className?: string
}

function useBackendConfigured() {
    return useSyncExternalStore(
        _callback => {
            // BackendProvider doesn't have a subscription mechanism,
            // so we return a no-op cleanup function
            return () => {}
        },
        () => BackendProvider.getInstance().isConfigured(),
        () => BackendProvider.getInstance().isConfigured()
    )
}

export function BackendStatus({ className }: BackendStatusProps) {
    const [config] = useState(getBackendConfig())
    const isConfigured = useBackendConfigured()

    useEffect(() => {
        const provider = BackendProvider.getInstance()
        if (!provider.isConfigured()) {
            provider.configure(config)
        }
    }, [config])

    const getStatusColor = () => {
        if (!isConfigured) return 'text-gray-500'
        return config.type === 'local' ? 'text-blue-500' : 'text-green-500'
    }

    const getStatusText = () => {
        if (!isConfigured) return 'Not configured'
        switch (config.type) {
            case 'local':
                return 'Demo Mode (Local)'
            case 'api':
                return 'Development Mode (API)'
            default:
                return 'Unknown Mode'
        }
    }

    const getDescription = () => {
        switch (config.type) {
            case 'local':
                return 'Uses @ratelock/local directly on the client. Ideal for public demos.'
            case 'api':
                return 'Uses Next.js API with database access (Redis, MongoDB). For development and testing.'
            default:
                return ''
        }
    }

    return (
        <Section className="py-12">
            <div
                className={`
                  relative border border-dashed border-border p-4
                  ${className}
                `}>
                <DiagonalLinesBackground />

                <div className="relative flex items-center justify-between">
                    <div>
                        <h3 className="font-serif text-xl font-semibold">Backend Rate Limiting</h3>
                        <p
                            className={`
                              font-mono text-sm
                              ${getStatusColor()}
                            `}>
                            {getStatusText()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{getDescription()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`
                              size-2.5 rounded-full
                              ${
                                  isConfigured
                                      ? config.type === 'local'
                                          ? 'bg-blue-500'
                                          : 'bg-green-500'
                                      : 'bg-gray-400'
                              }
                            `}
                        />
                        <span className="text-xs text-muted-foreground">
                            {isConfigured ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                {config.type === 'api' && config.api && (
                    <div className="mt-3 text-xs text-muted-foreground">
                        <div>Base URL: {config.api.baseUrl || 'Relative'}</div>
                        <div>Timeout: {config.api.timeout}ms</div>
                    </div>
                )}
                {config.type === 'local' && (
                    <div className="mt-3 text-xs text-yellow-600">
                        ⚠️ Demo mode: data is stored in local memory only
                    </div>
                )}
            </div>
        </Section>
    )
}
