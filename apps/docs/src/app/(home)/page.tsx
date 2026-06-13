import type { Metadata } from 'next'
import { EnginesSection } from './sections/engines'
import { FeaturesSection } from './sections/features'
import { PerformanceSection } from './sections/performance'
import { FooterSection } from './sections/footer-section'
import { HeroSection } from './sections/hero'
import { SimulationSection } from './sections/simulation-section'
import { BfcacheRemount } from './bfcache-remount'

export const metadata: Metadata = {
    title: 'RateLock',
    description: 'Bulletproof rate limiting for modern applications',
    openGraph: {
        title: 'RateLock',
        description: 'Bulletproof rate limiting for modern applications',
        images: '/og/home/image.png',
    },
    twitter: {
        images: '/og/home/image.png',
    },
}

export default function HomePage() {
    return (
        <BfcacheRemount>
            <main className="flex-1">
                <HeroSection />
                <FeaturesSection />
                <SimulationSection />
                <EnginesSection />
                <PerformanceSection />
                <FooterSection />
            </main>
        </BfcacheRemount>
    )
}
