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
            <LandingBackground
                className="
              absolute top-0 left-1/2 -translate-x-1/2 transform
            "
            />
            <Section className="flex items-center justify-center py-32">
                <div className="relative container text-center">
                    <div
                        className="
                          mx-auto flex max-w-md flex-col items-center gap-6
                        ">
                        <h1
                            className="
                              max-w-xs font-sans text-xl font-semibold
                              tracking-normal
                              lg:text-5xl
                            ">
                            {heading}
                        </h1>
                        <p
                            className="
                              font-normal text-balance text-muted-foreground
                            ">
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
