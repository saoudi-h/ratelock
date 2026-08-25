import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { ReactNode } from 'react'

import { baseOptions } from '@/app/layout.config'

import { FooterSection } from './sections/footer-section'

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <HomeLayout {...baseOptions}>
            {children}
            <FooterSection />
        </HomeLayout>
    )
}
