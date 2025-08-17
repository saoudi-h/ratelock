import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Arvo } from 'next/font/google'
import './globals.css'

const interSans = Inter({
    variable: '--font-sans',
    subsets: ['latin'],
})

const jetBrainsMono = JetBrains_Mono({
    variable: '--font-mono',
    subsets: ['latin'],
})

const arvo = Arvo({
    variable: '--font-serif',
    weight: '400',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'RateLock Playground',
    description: 'Explore different rate limiting strategies with interactive visualizations.',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body
                className={cn(
                    interSans.variable,
                    jetBrainsMono.variable,
                    arvo.variable,
                    'antialiased'
                )}>
                {children}
            </body>
        </html>
    )
}
