'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

const features = [
    {
        title: 'Fixed Window',
        description:
            'Simple and efficient. Count requests within fixed time intervals. Perfect for basic rate limiting needs.',
        tag: 'Simple',
    },
    {
        title: 'Sliding Log',
        description:
            'Precise tracking of every request. No boundary issues, complete accuracy at the cost of memory.',
        tag: 'Precise',
    },
    {
        title: 'Sliding Window',
        description:
            'Best of both worlds. Smooth rate limiting without the edge cases of fixed windows.',
        tag: 'Balanced',
    },
    {
        title: 'Token Bucket',
        description:
            'Allow bursts while maintaining average rate. Ideal for APIs that need to handle traffic spikes gracefully.',
        tag: 'Flexible',
    },
    {
        title: 'Built-in Resilience',
        description:
            'Decorators for retry, circuit breaker, timeout, and fallback. Protect your app from cascading failures.',
        tag: 'Resilient',
    },
    {
        title: 'Zero Config Local',
        description:
            'In-memory adapter with zero dependencies. Get started in seconds, scale to Redis or Postgres when ready.',
        tag: 'Instant',
    },
]

export function FeaturesSection() {
    return (
        <section className="relative">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 md:mb-16"
                >
                    <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                        Everything you need,
                        <br />
                        nothing you don&apos;t
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Four rate limiting strategies, three storage adapters,
                        and built-in resilience patterns.
                    </p>
                </motion.div>

                <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                        >
                            <div
                                className="group p-8 transition-colors hover:bg-muted"
                                style={{ backgroundColor: 'var(--card)' }}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <Badge
                                        variant="outline"
                                        className="border-border text-xs text-muted-foreground"
                                    >
                                        {feature.tag}
                                    </Badge>
                                </div>
                                <h3 className="font-heading text-lg font-semibold">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm/relaxed text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
