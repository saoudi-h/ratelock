'use client'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Provider as JotaiProvider } from 'jotai'
import { ReactLenis } from 'lenis/react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React from 'react'

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <JotaiProvider>
            <RootProvider>
                <NuqsAdapter>
                    <TooltipProvider>
                        <ReactLenis
                            root
                            options={{
                                autoRaf: true,
                            }}>
                            {children}
                            <Toaster />
                        </ReactLenis>
                    </TooltipProvider>
                </NuqsAdapter>
            </RootProvider>
        </JotaiProvider>
    )
}

export default Providers
