import { HeroSection } from './sections/hero-section'
import { FeaturesSection } from './sections/features-section'
import { DemoSection } from './sections/demo-section'
import { SimulationSection } from './sections/simulation-section'
import { AdaptersSection } from './sections/adapters-section'
import { FooterSection } from './sections/footer-section'

export default function HomePage() {
    return (
        <main className="flex-1">
            <HeroSection />
            <FeaturesSection />
            <DemoSection />
            <SimulationSection />
            <AdaptersSection />
            <FooterSection />
        </main>
    )
}
