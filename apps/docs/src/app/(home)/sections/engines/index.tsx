'use client'

import { EngineBentoCard } from '../../components/engine-bento-card'
import { SectionHeader } from '../../components/section-header'
import { SwapBackendsTile } from './swap-backends-tile'

const ENGINES = [
    {
        name: 'Local',
        tagline: 'In-memory Maps, zero dependencies',
        bestFor: 'Edge functions & single-process nodes',
        metrics: [
            { name: 'Avg latency', val: '< 0.02ms' },
            { name: 'External Deps', val: '0' },
            { name: 'Memory model', val: 'JS Map' },
        ],
        icon: 'solar:ssd-round-bold-duotone',
        brandIcon: 'logos:javascript',
        color: 'text-blue-500',
    },
    {
        name: 'Redis',
        tagline: 'Atomic Lua script pipeline execution',
        bestFor: 'High-traffic distributed clusters',
        metrics: [
            { name: 'Concurrency', val: 'Lua atomic' },
            { name: 'Thread-safety', val: 'Single-thread' },
            { name: 'Data structure', val: 'Sorted Sets' },
        ],
        icon: 'solar:database-bold-duotone',
        brandIcon: 'logos:redis',
        color: 'text-red-500',
    },
    {
        name: 'PostgreSQL',
        tagline: 'Isolated transactional UPSERT queries',
        bestFor: 'Enterprise databases already in your stack',
        metrics: [
            { name: 'Concurrency', val: 'SQL UPSERT' },
            { name: 'Atomicity', val: 'ACID safe' },
            { name: 'Table schema', val: 'Key-value index' },
        ],
        icon: 'solar:server-bold-duotone',
        brandIcon: 'logos:postgresql',
        color: 'text-sky-600',
    },
]

export function EnginesSection() {
    return (
        <section className="relative border-y border-border/40 bg-muted/30">
            <div
                className="
                  mx-auto max-w-7xl px-6 py-20
                  md:py-28
                ">
                <div className="mb-16">
                    <SectionHeader
                        eyebrow="Infrastructure"
                        eyebrowIcon="solar:database-bold-duotone"
                        eyebrowTheme="primary"
                        title={`One API,\nany backend.`}
                        description="Scale from rapid local edge nodes up to massive Postgres or Redis clusters. Swap storage backends instantly by changing a single package import."
                    />
                </div>

                <div
                    className="
                      grid grid-cols-1 gap-6
                      md:auto-rows-fr md:grid-cols-3
                    ">
                    {ENGINES.map((engine, i) => (
                        <EngineBentoCard key={engine.name} index={i} {...engine} />
                    ))}
                    <div className="md:col-span-3">
                        <SwapBackendsTile />
                    </div>
                </div>
            </div>
        </section>
    )
}
