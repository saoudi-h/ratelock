import { EnginesSection } from './sections/engines-section'
import { FeaturesSection } from './sections/features-section'
import { FooterSection } from './sections/footer-section'
import { HeroSection } from './sections/hero-section'
import { PerformanceSection } from './sections/performance-section'
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
