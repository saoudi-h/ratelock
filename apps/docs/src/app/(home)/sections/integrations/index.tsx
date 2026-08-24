'use client'

import { useGSAP } from '@gsap/react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

import { gsap, registerGsap } from '../../_lib/gsap'
import { BentoBase } from '../../components/bento-base'
import { SectionHeader } from '../../components/section-header'

interface Framework {
    name: string
    tagline: string
    icon: string
    /** Docs path — integrations page for middlewares, recipes for guides */
    href: string
    kind: 'middleware' | 'guide'
}

const MIDDLEWARES: Framework[] = [
    {
        name: 'Hono',
        tagline: 'Edge-first middleware, web-standard responses',
        icon: 'logos:hono',
        href: '/docs/integrations/hono',
        kind: 'middleware',
    },
    {
        name: 'Express',
        tagline: 'One package for Express 4 and 5',
        icon: 'devicon:express',
        href: '/docs/integrations/express',
        kind: 'middleware',
    },
    {
        name: 'Fastify',
        tagline: 'onRequest plugin, encapsulation-safe',
        icon: 'devicon-plain:fastify',
        href: '/docs/integrations/fastify',
        kind: 'middleware',
    },
    {
        name: 'Elysia',
        tagline: 'Bun-native, pairs with our native Redis driver',
        icon: 'thesvg-color:elysiajs',
        href: '/docs/integrations/elysia',
        kind: 'middleware',
    },
]

const GUIDES: Framework[] = [
    {
        name: 'Next.js',
        tagline: 'App Router route handlers',
        icon: 'devicon-plain:nextjs',
        href: '/docs/integrations/framework-recipes#nextjs',
        kind: 'guide',
    },
    {
        name: 'SvelteKit',
        tagline: '+server.ts endpoints',
        icon: 'devicon:svelte',
        href: '/docs/integrations/framework-recipes#sveltekit',
        kind: 'guide',
    },
    {
        name: 'Astro',
        tagline: 'API endpoints',
        icon: 'devicon-plain:astro',
        href: '/docs/integrations/framework-recipes#astro',
        kind: 'guide',
    },
    {
        name: 'Remix',
        tagline: 'Loaders and actions',
        icon: 'simple-icons:remix',
        href: '/docs/integrations/framework-recipes#remix',
        kind: 'guide',
    },
]

function FrameworkTile({ framework }: { framework: Framework }) {
    const isMiddleware = framework.kind === 'middleware'

    return (
        <Link
            href={framework.href}
            data-tile
            className={cn(
                'block h-full rounded-4xl outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/50'
            )}>
            <BentoBase className="h-full">
                <div className="flex h-full flex-col justify-between gap-4">
                    <div className="flex items-start justify-between">
                        <Icon icon={framework.icon} className="size-8" />
                        <span
                            className={cn(
                                `
                                  inline-flex items-center gap-1 rounded-full border px-2 py-0.5
                                  text-[10px] font-semibold tracking-wide uppercase select-none
                                `,
                                isMiddleware
                                    ? `border-emerald-500/20 bg-emerald-500/5 text-emerald-500`
                                    : `border-sky-500/20 bg-sky-500/5 text-sky-500`
                            )}>
                            {isMiddleware ? 'Middleware' : 'Guide'}
                        </span>
                    </div>
                    <div>
                        <h3
                            className="
                              font-heading text-lg font-bold tracking-tight text-foreground
                            ">
                            {framework.name}
                        </h3>
                        <p className="mt-1 text-sm/relaxed text-muted-foreground">
                            {framework.tagline}
                        </p>
                    </div>
                </div>
            </BentoBase>
        </Link>
    )
}

export function IntegrationsSection() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return

            gsap.from(ref.current.querySelectorAll('[data-tile]'), {
                y: 30,
                opacity: 0,
                duration: 0.6,
                ease: 'expo.out',
                stagger: 0.06,
                scrollTrigger: {
                    trigger: ref.current,
                    start: 'top 80%',
                    once: true,
                },
            })
        },
        { scope: ref }
    )

    return (
        <section className="relative border-y border-border/40 bg-muted">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28" ref={ref}>
                <div className="mb-16">
                    <SectionHeader
                        eyebrow="Integrations"
                        eyebrowIcon="solar:plug-circle-bold-duotone"
                        eyebrowTheme="emerald"
                        title={`Drop it into\nany stack.`}
                        description="Dedicated middlewares for pipeline frameworks, step-by-step guides for web-standard ones. Same limiters, same resilience policies, everywhere."
                    />
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {MIDDLEWARES.map(framework => (
                            <FrameworkTile key={framework.name} framework={framework} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {GUIDES.map(framework => (
                            <FrameworkTile key={framework.name} framework={framework} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
