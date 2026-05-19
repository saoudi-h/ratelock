import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import Providers from './Providers'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
})

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={inter.className} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
