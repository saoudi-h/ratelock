import type { Metadata } from 'next'

import { BfcacheRemount } from './bfcache-remount'
import { EnginesSection } from './sections/engines'
import { FeaturesSection } from './sections/features'
import { HeroSection } from './sections/hero'
import { IntegrationsSection } from './sections/integrations'
import { PerformanceSection } from './sections/performance'
import { SimulationSection } from './sections/simulation-section'

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
                <IntegrationsSection />
                <PerformanceSection />
            </main>
        </BfcacheRemount>
    )
}
