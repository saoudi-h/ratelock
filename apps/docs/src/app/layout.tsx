import { Funnel_Display, Funnel_Sans, Ubuntu_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createMetadata } from '@/lib/metadata'
import Providers from './Providers'
import './globals.css'

export const metadata: Metadata = createMetadata({
    title: {
        template: '%s | RateLock',
        default: 'RateLock',
    },
    description: 'Bulletproof rate limiting for modern applications',
})

const funnelDisplay = Funnel_Display({
    subsets: ['latin'],
    variable: '--font-heading',
})

const funnelSans = Funnel_Sans({
    subsets: ['latin'],
    variable: '--font-body',
})

const ubuntuMono = Ubuntu_Mono({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-mono',
})

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="en"
            className={`
              ${funnelDisplay.variable}
              ${funnelSans.variable}
              ${ubuntuMono.variable}
            `}
            suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
