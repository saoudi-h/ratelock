'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'

const features = [
    {
        title: 'Fixed Window',
        description:
            'Simple et ultra-performant. Compte les requêtes dans des intervalles de temps fixes. Idéal pour des limites basiques.',
        tag: 'Simple',
        icon: 'solar:calendar-date-bold-duotone',
        color: 'text-blue-500',
    },
    {
        title: 'Sliding Log',
        description:
            'Précision chirurgicale. Suit chaque requête individuellement avec son timestamp. Une exactitude parfaite.',
        tag: 'Précis',
        icon: 'solar:document-bold-duotone',
        color: 'text-amber-500',
    },
    {
        title: 'Sliding Window',
        description:
            'Le meilleur des deux mondes. Limites lisses calculées sur une fenêtre glissante sans effet de frontière.',
        tag: 'Équilibré',
        icon: 'solar:history-bold-duotone',
        color: 'text-emerald-500',
    },
    {
        title: 'Token Bucket',
        description:
            'Autorise les pics de trafic temporaires tout en garantissant un débit moyen stable grâce au rechargement de jetons.',
        tag: 'Flexible',
        icon: 'solar:cup-bold-duotone',
        color: 'text-purple-500',
    },
    {
        title: 'Built-in Resilience',
        description:
            'Intégration native de décotateurs de circuit-breaker, retry exponentiel et fallback pour blinder vos APIs.',
        tag: 'Résilient',
        icon: 'solar:shield-up-bold-duotone',
        color: 'text-rose-500',
    },
    {
        title: 'Zero Config Local',
        description:
            'Fonctionne en mémoire locale instantanément sans base de données, parfait pour vos tests ou le serverless.',
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
                        Fonctionnalités Clés
                    </span>
                    <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
                        Tout ce dont vous avez besoin,
                        <br />
                        sans fioritures.
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Quatre stratégies de rate-limiting, trois adaptateurs de stockage résilients et des décorateurs intuitifs.
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
