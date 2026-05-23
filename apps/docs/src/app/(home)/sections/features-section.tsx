'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'

const features = [
    {
        title: 'Fixed Window',
        description:
            'Simple and highly performant. Counts requests in fixed time intervals. Ideal for basic rate limit constraints.',
        tag: 'Simple',
        icon: 'solar:calendar-date-bold-duotone',
        color: 'text-blue-500',
    },
    {
        title: 'Sliding Log',
        description:
            'Surgical precision. Tracks each request individually with its timestamp. Guarantees perfect mathematical accuracy.',
        tag: 'Precise',
        icon: 'solar:document-bold-duotone',
        color: 'text-amber-500',
    },
    {
        title: 'Sliding Window',
        description:
            'Best of both worlds. Smooth rate limits calculated over a sliding window without boundary reset spikes.',
        tag: 'Balanced',
        icon: 'solar:history-bold-duotone',
        color: 'text-emerald-500',
    },
    {
        title: 'Token Bucket',
        description:
            'Permits temporary traffic bursts while guaranteeing a stable average throughput using token refills.',
        tag: 'Flexible',
        icon: 'solar:cup-bold-duotone',
        color: 'text-purple-500',
    },
    {
        title: 'Built-in Resilience',
        description:
            'Native decorators supporting circuit breaker, exponential retry backoff, and fallback to keep your APIs resilient.',
        tag: 'Resilient',
        icon: 'solar:shield-up-bold-duotone',
        color: 'text-rose-500',
    },
    {
        title: 'Zero Config Local',
        description:
            'Works instantly in local memory without an external database, ideal for testing, local development, and serverless.',
        tag: 'Instant',
        icon: 'solar:bolt-bold-duotone',
        color: 'text-yellow-500',
    },
]

export function SpotlightCard({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState({ x: 0, y: 0 })
    const [isFocused, setIsFocused] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setCoords({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsFocused(true)}
            onMouseLeave={() => setIsFocused(false)}
            className={`
              relative overflow-hidden rounded-2xl border border-border/70 bg-card p-8
              transition-all duration-300 hover:shadow-lg hover:border-primary/20
              ${className ?? ''}
            `}
        >
            {isFocused && (
                <div
                    className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, var(--color-primary-rgb, oklch(0.70 0.20 160 / 10%)), transparent 80%)`,
                    }}
                />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    )
}

export function FeaturesSection() {
    return (
        <section className="relative bg-background">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                <div className="mb-16 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                        <Icon icon="solar:widget-bold-duotone" className="size-3.5" />
                        Key Features
                    </span>
                    <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
                        Everything you need,
                        <br />
                        none of the fluff.
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Four rate-limiting strategies, three resilient storage adapters, and highly intuitive decorators.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <SpotlightCard key={feature.title}>
                            <div className="flex items-center justify-between">
                                <div className={`
                                  flex size-11 items-center justify-center rounded-xl bg-muted/60
                                  ${feature.color}
                                `}>
                                    <Icon icon={feature.icon} className="size-6" />
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-border/60 text-xs text-muted-foreground/80 bg-background/50 font-medium"
                                >
                                    {feature.tag}
                                </Badge>
                            </div>
                            <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">
                                {feature.title}
                            </h3>
                            <p className="mt-3 text-sm/relaxed text-muted-foreground/85">
                                {feature.description}
                            </p>
                        </SpotlightCard>
                    ))}
                </div>
            </div>
        </section>
    )
}
