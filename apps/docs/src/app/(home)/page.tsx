import { EnginesSection } from './sections/engines'
import { FeaturesSection } from './sections/features'
import { PerformanceSection } from './sections/performance'
import { FooterSection } from './sections/footer-section'
import { HeroSection } from './sections/hero'
import { SimulationSection } from './sections/simulation-section'

export default function HomePage() {
    return (
        <main className="flex-1">
            <HeroSection />
            <FeaturesSection />
            <SimulationSection />
            <EnginesSection />
            <PerformanceSection />
            <FooterSection />
        </main>
    )
}
