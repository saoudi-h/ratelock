import { BackendStatus } from '@/simulation/components/backend-status'
import { Section } from '@/components/blocks/Section'
import { SectionSeparator } from '@/components/blocks/SectionSeparator'
import { StrategyTabs } from '@/simulation/components/StrategyTabs'

export default function Home() {
    const heading = 'RateLock Playground'
    const description =
        'Explore different rate limiting strategies with interactive visualizations. Each strategy runs independently with its own mini-game.'
    return (
        <>
            <Section className="py-32">
                <div className="container text-center">
                    <div className="mx-auto flex max-w-5xl flex-col gap-6">
                        <h1 className="text-3xl font-extrabold font-serif lg:text-6xl">
                            {heading}
                        </h1>
                        <p className="text-muted-foreground text-balance lg:text-lg">
                            {description}
                        </p>
                        <div className="mx-auto max-w-2xl">
                            <BackendStatus />
                        </div>
                    </div>
                </div>
            </Section>
            <SectionSeparator />
            <StrategyTabs />
        </>
    )
}
