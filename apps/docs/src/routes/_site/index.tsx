import { createFileRoute } from '@tanstack/react-router'

import { lazyWhenIdle } from '~/components/home/_lib/lazy-when-idle'
import { BfcacheRemount } from '~/components/home/bfcache-remount'
import { HeroSection } from '~/components/home/sections/hero'
import { seo } from '~/utils/seo'

const FeaturesSection = lazyWhenIdle(() =>
    import('~/components/home/sections/features').then(m => m.FeaturesSection)
)
const SimulationSection = lazyWhenIdle(() =>
    import('~/components/home/sections/simulation-section').then(m => m.SimulationSection)
)
const EnginesSection = lazyWhenIdle(() =>
    import('~/components/home/sections/engines').then(m => m.EnginesSection)
)
const IntegrationsSection = lazyWhenIdle(() =>
    import('~/components/home/sections/integrations').then(m => m.IntegrationsSection)
)
const PerformanceSection = lazyWhenIdle(() =>
    import('~/components/home/sections/performance').then(m => m.PerformanceSection)
)

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
