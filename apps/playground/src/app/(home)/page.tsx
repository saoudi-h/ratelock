import { LandingBackground } from '@/components/blocks/LandingBackground'
import { Section } from '@/components/blocks/Section'
import { SectionSeparator } from '@/components/blocks/SectionSeparator'
import { BackendStatus } from '@/simulation/components/backend-status'
import { StrategyTabs } from '@/simulation/components/StrategyTabs'

export default function Home() {
    const heading = 'RateLock Playground'
    const description =
        'Explore different rate limiting strategies with interactive visualizations. Each strategy runs independently with its own mini-game.'
    return (
        <>
            <LandingBackground className="absolute top-0 left-1/2 transform -translate-x-1/2" />
            <Section className="py-32 flex items-center justify-center">
                <div className="container text-center relative">
                    <div className="mx-auto flex max-w-md flex-col gap-6 items-center">
                        <h1 className="text-xl font-semibold font-sans max-w-xs lg:text-5xl letter-spacing-normal tracking-tight">
                            {heading}
                        </h1>
                        <p className="text-muted-foreground text-balance font-normal">
                            {description}
                        </p>
                    </div>
                </div>
            </Section>
            <SectionSeparator />
            <StrategyTabs />
            <SectionSeparator />
            <BackendStatus />
        </>
    )
}
