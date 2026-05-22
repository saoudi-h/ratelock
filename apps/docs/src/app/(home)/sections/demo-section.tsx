'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightBold } from '@solar-icons/react-perf'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function DemoSection() {
    return (
        <section className="relative overflow-hidden bg-muted">
            <div className="pattern-grid pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-muted via-transparent to-muted" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--primary)/5%,transparent)]" />

            <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 md:mb-16"
                >
                    <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                        See it in action
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Interactive simulation coming soon. For now, explore the
                        playground or dive into the docs.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="overflow-hidden rounded-xl border border-border/50 bg-card"
                >
                    <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                        <div className="size-3 rounded-full bg-muted-foreground/20" />
                        <div className="size-3 rounded-full bg-muted-foreground/20" />
                        <div className="size-3 rounded-full bg-muted-foreground/20" />
                        <span className="ml-2 text-xs text-muted-foreground">
                            quick-start.ts
                        </span>
                    </div>
                    <pre className="overflow-x-auto p-6 font-mono text-sm/relaxed">
                        <code className="text-foreground">
{`import { fixedWindow } from '@ratelock/local'

const limiter = fixedWindow({
  max: 100,
  windowMs: 60_000, // 1 minute
})

// Use as a decorator in your classes
class ApiService {
  @limiter()
  async fetchData(key: string) {
    // This will be rate limited automatically
    return fetch(\`/api/data/\${key}\`)
  }
}

// Or use it standalone
const result = await limiter.consume('user:123')
console.log(result.remaining) // 99`}
                        </code>
                    </pre>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8"
                >
                    <Link
                        href="/docs/getting-started/quick-start"
                        className={cn(
                            buttonVariants({ variant: 'outline', size: 'lg' })
                        )}
                    >
                        View Quick Start
                        <ArrowRightBold className="ml-2 size-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
