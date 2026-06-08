'use client'

import { SectionHeader } from '../../components/section-header'
import { CircuitBreakerCard } from './circuit-breaker-card'
import { DenyCacheShieldCard } from './deny-cache-shield-card'
import { ErrorPoliciesCard } from './error-policies-card'
import { FallbackPoliciesCard } from './fallback-policies-card'

export function FeaturesSection() {
    return (
        <section className="relative border-y border-border/40 bg-muted/30">
            <div
                className="
                  mx-auto max-w-7xl px-6 py-20
                  md:py-28
                ">
                <div className="mb-16">
                    <SectionHeader
                        eyebrow="Network Resilience"
                        eyebrowIcon="solar:shield-up-bold-duotone"
                        eyebrowTheme="primary"
                        title={`Designed for\nnetwork resilience.`}
                        description="A rate limiter should stay robust when your database is under load or temporarily unreachable. RateLock includes built-in policies like retries, circuit breakers, and local memory caching to help you handle transient errors gracefully."
                    />
                </div>

                <div
                    className="
                      grid grid-cols-1 gap-6
                      md:grid-cols-3
                    ">
                    <DenyCacheShieldCard />
                    <CircuitBreakerCard />
                    <FallbackPoliciesCard />
                    <ErrorPoliciesCard />
                </div>
            </div>
        </section>
    )
}
