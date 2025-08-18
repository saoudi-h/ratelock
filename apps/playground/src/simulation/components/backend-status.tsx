'use client'
import { DiagonalLinesBackground } from '@/components/blocks/DiagonalLinesBackground'
import { Section } from '@/components/blocks/Section'
import { getBackendConfig } from '@/simulation/config/backend'
import { BackendProvider } from '@/simulation/services/backends'
import { useEffect, useState } from 'react'

interface BackendStatusProps {
    className?: string
}

export function BackendStatus({ className }: BackendStatusProps) {
    const [config] = useState(getBackendConfig())
    const [isConfigured, setIsConfigured] = useState(false)

    useEffect(() => {
        const provider = BackendProvider.getInstance()
        setIsConfigured(provider.isConfigured())
        if (!provider.isConfigured()) {
            provider.configure(config)
            setIsConfigured(true)
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
            <div className={`border border-border border-dashed p-4 relative ${className}`}>
                <DiagonalLinesBackground />

                <div className="flex items-center justify-between relative">
                    <div>
                        <h3 className="font-serif text-xl font-semibold">Backend Rate Limiting</h3>
                        <p className={`text-sm font-mono ${getStatusColor()}`}>{getStatusText()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getDescription()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`size-2.5 rounded-full ${
                                isConfigured
                                    ? config.type === 'local'
                                        ? 'bg-blue-500'
                                        : 'bg-green-500'
                                    : 'bg-gray-400'
                            }`}
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
