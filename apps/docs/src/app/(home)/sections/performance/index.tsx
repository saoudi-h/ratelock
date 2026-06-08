import { SectionHeader } from '../../components/section-header'
import { DenyCacheVisualization } from './deny-cache-visualization'
import { ExploreCta } from './explore-cta'
import { ThroughputComparison } from './throughput-comparison'

export function PerformanceSection() {
    return (
        <section
            id="performance"
            className="container mx-auto max-w-7xl px-6 py-20 lg:py-32">
            <SectionHeader
                eyebrow="Performance"
                title="Numbers, not promises"
                description="Hard, reproducible numbers from the same matrix and code paths on every supported backend. Below: throughput vs. the most popular Node.js rate-limiters, and how the deny cache shields your storage layer from abuse."
            />

            <div
                className="
                  mt-12 grid grid-cols-1 gap-6
                  lg:grid-cols-12 lg:items-stretch
                ">
                <ThroughputComparison />
                <DenyCacheVisualization />
            </div>

            <div className="mt-6">
                <ExploreCta />
            </div>
        </section>
    )
}
