import { Footer } from '@/components/blocks/footer'
import { Header } from '@/components/blocks/header'
import { SectionWrapper } from '@/components/blocks/SectionWrapper'
import { cn } from '@/lib/utils'
import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider } from 'next-themes'
import React from 'react'

interface Props {
    children: React.ReactNode
}

const Layout = ({ children }: Props) => {
    return (
        <JotaiProvider>
            <ThemeProvider attribute="class" defaultTheme="dark">
                <div className={cn('flex min-h-screen flex-col bg-background w-full')}>
                    <Header />
                    <SectionWrapper className="flex flex-col flex-1 w-full">
                        {children}
                    </SectionWrapper>
                    <Footer />
                </div>
            </ThemeProvider>
        </JotaiProvider>
    )
}

export default Layout
