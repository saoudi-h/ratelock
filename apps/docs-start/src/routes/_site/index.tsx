import { createFileRoute } from '@tanstack/react-router'

import { BfcacheRemount } from '~/components/home/bfcache-remount'
import { EnginesSection } from '~/components/home/sections/engines'
import { FeaturesSection } from '~/components/home/sections/features'
import { HeroSection } from '~/components/home/sections/hero'
import { IntegrationsSection } from '~/components/home/sections/integrations'
import { PerformanceSection } from '~/components/home/sections/performance'
import { SimulationSection } from '~/components/home/sections/simulation-section'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_site/')({
    head: () =>
        seo({
            title: 'RateLock',
            description: 'Bulletproof rate limiting for modern applications',
            path: '/',
        }),
    component: HomePage,
})

function HomePage() {
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
