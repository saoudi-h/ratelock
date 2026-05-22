'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdaptersSection() {
    const adapters = [
        {
            name: 'Local',
            tagline: 'In-memory, zero dependencies',
            bestFor: 'Development & single-instance apps',
            complexity: 'Simple',
        },
        {
            name: 'Redis',
            tagline: 'Distributed, high performance',
            bestFor: 'Production & multi-instance apps',
            complexity: 'Moderate',
        },
        {
            name: 'PostgreSQL',
            tagline: 'Relational, already in your stack',
            bestFor: 'Teams with existing Postgres infra',
            complexity: 'Moderate',
        },
    ]

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
                        One API, any backend
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Start local, scale to Redis or Postgres. Same decorators, same API, zero code changes.
                    </p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-3">
                    {adapters.map((adapter, i) => (
                        <motion.div
                            key={adapter.name}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                        >
                            <Card className="h-full">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-heading text-xl">
                                            {adapter.name}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="border-border text-xs"
                                        >
                                            {adapter.complexity}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {adapter.tagline}
                                    </p>
                                    <div className="mt-6 border-t border-border pt-4">
                                        <p className="text-xs text-muted-foreground">
                                            Best for
                                        </p>
                                        <p className="mt-1 text-sm font-medium">
                                            {adapter.bestFor}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
