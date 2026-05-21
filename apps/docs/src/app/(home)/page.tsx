'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowRightBold } from '@solar-icons/react-perf'
import { Icon } from '@iconify/react'
import { createHighlighter } from 'shiki'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/* ============================================
   ANIMATED TEXT COMPONENT
   ============================================ */

function AnimatedHeading({
    children,
    className,
    delay = 0,
}: {
    children: string
    className?: string
    delay?: number
}) {
    const words = children.split(' ')
    const [visibleCount, setVisibleCount] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisibleCount(words.length)
        }, delay)
        return () => clearTimeout(timer)
    }, [words.length, delay])

    return (
        <span className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: i < visibleCount ? 1 : 0,
                        y: i < visibleCount ? 0 : 20,
                    }}
                    transition={{
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: i * 0.08,
                    }}
                    className="mr-[0.25em] inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}

/* ============================================
   SHIKI HIGHLIGHTER (singleton)
   ============================================ */

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null

function getHighlighter() {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ['github-dark', 'github-light'],
            langs: ['typescript'],
        })
    }
    return highlighterPromise
}

/* ============================================
   ANIMATED CODE PANEL
   ============================================ */

const codeExamples = [
    {
        package: '@ratelock/local',
        strategy: 'fixedWindow',
        code: `import { fixedWindow } from '@ratelock/local'

const limiter = fixedWindow({
  max: 100,
  windowMs: 60_000,
})

const result = await limiter.check('user:123')

if (result.success) {
  // Request allowed
  console.log(result.remaining) // 99
}`,
    },
    {
        package: '@ratelock/redis',
        strategy: 'slidingWindow',
        code: `import { slidingWindow } from '@ratelock/redis'

const limiter = slidingWindow({
  max: 50,
  windowMs: 30_000,
  redis: createClient(),
})

const result = await limiter.check('api:endpoint')

if (result.success) {
  // Request allowed
  console.log(result.remaining) // 49
}`,
    },
    {
        package: '@ratelock/postgres',
        strategy: 'tokenBucket',
        code: `import { tokenBucket } from '@ratelock/postgres'

const limiter = tokenBucket({
  capacity: 200,
  refillRate: 10,
  refillInterval: 1_000,
  db: pool,
})

const result = await limiter.check('service:auth')

if (result.success) {
  // Request allowed
  console.log(result.remaining) // 199
}`,
    },
]

function AnimatedCodePanel() {
    const [index, setIndex] = useState(0)
    const [html, setHtml] = useState('')
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'))
        }
        checkDark()
        const observer = new MutationObserver(checkDark)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let cancelled = false
        const current = codeExamples[index]
        if (!current) return

        getHighlighter().then((highlighter) => {
            if (cancelled) return
            const result = highlighter.codeToHtml(current.code, {
                lang: 'typescript',
                theme: isDark ? 'github-dark' : 'github-light',
            })
            setHtml(result)
        })

        return () => { cancelled = true }
    }, [index, isDark])

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % codeExamples.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border">
            {/* Window chrome */}
            <div className="
              flex items-center gap-2 border-b border-border bg-muted px-4 py-3
            ">
                <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-red-500" />
                    <div className="size-3 rounded-full bg-yellow-500" />
                    <div className="size-3 rounded-full bg-green-500" />
                </div>
            </div>

            {/* Code content */}
            <div className="bg-background p-5 text-[13px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="
                          [&_code]:font-mono! [&_code]:text-[13px]!
                          [&_code]:leading-relaxed!
                          [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0!
                        "
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </AnimatePresence>
            </div>

            {/* Package indicators */}
            <div className="
              flex items-center gap-1.5 border-t border-border bg-muted px-4
              py-2.5
            ">
                {codeExamples.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`
                          h-1.5 rounded-full transition-all duration-300
                          ${
                            i === index
                                ? 'w-6 bg-primary'
                                : `
                                  w-1.5 bg-muted-foreground/20
                                  hover:bg-muted-foreground/40
                                `
                        }
                        `}
                    />
                ))}
            </div>
        </div>
    )
}

/* ============================================
   HERO SECTION
   ============================================ */

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-muted">
            <div
                className="pattern-grid pointer-events-none absolute inset-0"
                style={{
                    maskImage: 'radial-gradient(ellipse 70% 60% at 70% 40%, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 70% 40%, black 20%, transparent 70%)',
                }}
            />
            <div className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(ellipse_60%_40%_at_70%_30%,var(--primary)/6%,transparent)]
            " />

            <div className="
              relative mx-auto max-w-7xl px-6 py-16
              md:py-24
            ">
                <div className="
                  grid items-center gap-12
                  lg:grid-cols-2 lg:gap-16
                ">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="mb-6"
                        >
                            <span className="
                              inline-flex items-center gap-2 rounded-lg border
                              border-border/60 bg-card px-3 py-1.5 text-xs
                              font-medium text-muted-foreground
                            ">
                                <span className="
                                  size-1.5 rounded-full bg-primary
                                " />
                                v0.2, Open Source
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="
                              font-heading text-6xl leading-[0.95] font-black
                              tracking-tight
                              md:text-7xl
                              lg:text-8xl
                            "
                        >
                            <span className="text-foreground">Rate limiting, </span>
                            <span className="text-gradient">crafted.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="
                              mt-6 max-w-md text-base text-muted-foreground
                              md:text-lg
                            "
                        >
                            A TypeScript rate limiting suite that&apos;s precise,
                            flexible, and a pleasure to use.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                            className="mt-8 flex flex-wrap items-center gap-4"
                        >
                            <Link
                                href="/docs"
                                className="
                                  group relative inline-flex h-11 items-center
                                  justify-center gap-2 rounded-xl bg-transparent
                                  px-6 text-sm font-medium text-foreground
                                  transition-all
                                  hover:bg-muted
                                "
                            >
                                <span className="
                                  pointer-events-none absolute inset-0
                                  rounded-xl border border-primary
                                " />
                                <span className="
                                  pointer-events-none absolute inset-[3px]
                                  rounded-[9px] border border-primary/50
                                " />
                                <span className="relative">Get Started</span>
                                <ArrowRightBold className="
                                  relative ml-1 size-4 text-primary
                                  transition-transform
                                  group-hover:translate-x-0.5
                                " />
                            </Link>

                            <a
                                href="https://github.com/saoudi-h/ratelock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  group relative inline-flex h-11 items-center
                                  justify-center gap-2 rounded-xl bg-background
                                  px-6 text-sm font-medium text-foreground
                                  transition-all
                                  hover:bg-muted
                                "
                            >
                                <span className="
                                  pointer-events-none absolute inset-0
                                  rounded-xl border border-border
                                " />
                                <span className="
                                  pointer-events-none absolute inset-[2px]
                                  rounded-[10px] border border-border/50
                                " />
                                <span className="relative">
                                    <Icon icon="mdi:github" className="
                                      mr-1.5 size-4
                                    " />
                                </span>
                                <span className="relative">GitHub</span>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.2 }}
                            className="
                              mt-12 grid grid-cols-3 gap-6 border-t
                              border-border/40 pt-8
                            "
                        >
                            {[
                                { value: '4', label: 'Strategies' },
                                { value: '3', label: 'Adapters' },
                                { value: '0', label: 'Deps (local)' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="
                                      font-heading text-4xl leading-none
                                      font-black tracking-tight
                                      md:text-5xl
                                    ">
                                        <span
                                            className="
                                              bg-linear-to-t from-neutral-800                                              
                                              via-neutral-500 to-neutral-800
                                              bg-clip-text text-transparent
                                              dark:from-neutral-100
                                              dark:via-neutral-300
                                              dark:to-neutral-100
                                              text-shadow-2xs
                                            "
                                        >
                                            {stat.value}
                                        </span>
                                    </div>
                                    <div className="
                                      mt-2 text-xs font-medium tracking-wider
                                      text-muted-foreground uppercase
                                    ">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="
                          hidden
                          lg:block
                        "
                    >
                        <AnimatedCodePanel />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

/* ============================================
   FEATURES SECTION
   ============================================ */

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

function FeaturesSection() {
    return (
        <section className="relative">
            <div className="
              mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="
                      mb-12
                      md:mb-16
                    "
                >
                    <h2 className="
                      font-heading text-3xl font-semibold tracking-tight
                      md:text-4xl
                    ">
                        Everything you need,
                        <br />
                        nothing you don&apos;t
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Four rate limiting strategies, three storage adapters,
                        and built-in resilience patterns.
                    </p>
                </motion.div>

                <div className="
                  grid gap-px bg-border
                  md:grid-cols-2
                  lg:grid-cols-3
                ">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                        >
                            <div className="
                              group p-8 transition-colors
                              hover:bg-muted
                            " style={{ backgroundColor: 'var(--card)' }}>
                                <div className="
                                  mb-4 flex items-center justify-between
                                ">
                                    <Badge
                                        variant="outline"
                                        className="
                                          border-border text-xs
                                          text-muted-foreground
                                        "
                                    >
                                        {feature.tag}
                                    </Badge>
                                </div>
                                <h3 className="
                                  font-heading text-lg font-semibold
                                ">
                                    {feature.title}
                                </h3>
                                <p className="
                                  mt-3 text-sm/relaxed text-muted-foreground
                                ">
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

/* ============================================
   DEMO SECTION
   ============================================ */

function DemoSection() {
    return (
        <section className="relative overflow-hidden bg-muted">
            <div className="pattern-grid pointer-events-none absolute inset-0" />
            <div className="
              pointer-events-none absolute inset-0 bg-linear-to-b from-muted
              via-transparent to-muted
            " />
            <div className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--primary)/5%,transparent)]
            " />

            <div className="
              relative mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="
                      mb-12
                      md:mb-16
                    "
                >
                    <h2 className="
                      font-heading text-3xl font-semibold tracking-tight
                      md:text-4xl
                    ">
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
                    className="
                      overflow-hidden rounded-xl border border-border/50 bg-card
                    "
                >
                    <div className="
                      flex items-center gap-2 border-b border-border/50 px-4
                      py-3
                    ">
                        <div className="
                          size-3 rounded-full bg-muted-foreground/20
                        " />
                        <div className="
                          size-3 rounded-full bg-muted-foreground/20
                        " />
                        <div className="
                          size-3 rounded-full bg-muted-foreground/20
                        " />
                        <span className="ml-2 text-xs text-muted-foreground">
                            quick-start.ts
                        </span>
                    </div>
                    <pre className="
                      overflow-x-auto p-6 font-mono text-sm/relaxed
                    ">
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

/* ============================================
   ADAPTERS SECTION
   ============================================ */

function AdaptersSection() {
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
            <div className="
              mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="
                      mb-12
                      md:mb-16
                    "
                >
                    <h2 className="
                      font-heading text-3xl font-semibold tracking-tight
                      md:text-4xl
                    ">
                        One API, any backend
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Start local, scale to Redis or Postgres. Same decorators, same API, zero code changes.
                    </p>
                </motion.div>

                <div className="
                  grid gap-6
                  md:grid-cols-3
                ">
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
                                    <div className="
                                      flex items-center justify-between
                                    ">
                                        <CardTitle className="
                                          font-heading text-xl
                                        ">
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
                                    <div className="
                                      mt-6 border-t border-border pt-4
                                    ">
                                        <p className="
                                          text-xs text-muted-foreground
                                        ">
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

/* ============================================
   FOOTER SECTION
   ============================================ */

function FooterSection() {
    return (
        <footer className="relative border-t border-border/50 bg-muted">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="
                  flex flex-col items-start justify-between gap-8
                  md:flex-row md:items-center
                ">
                    <div>
                        <h3 className="font-heading text-lg font-semibold">
                            Ratelock
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Rate limiting, crafted with care.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <Link
                            href="/docs"
                            className="
                              flex items-center gap-2 text-muted-foreground
                              transition-colors
                              hover:text-foreground
                            "
                        >
                            <Icon icon="lucide:book-open" className="size-4" />
                            Documentation
                        </Link>
                        <a
                            href="https://github.com/saoudi-h/ratelock"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              flex items-center gap-2 text-muted-foreground
                              transition-colors
                              hover:text-foreground
                            "
                        >
                            <Icon icon="mdi:github" className="size-4" />
                            GitHub
                        </a>
                    </div>
                </div>

                <div className="
                  mt-8 flex flex-col items-start justify-between gap-4 border-t
                  border-border/50 pt-6 text-xs text-muted-foreground
                  md:flex-row md:items-center
                ">
                    <p>MIT License, free forever</p>
                    <p>Built with care by the RateLock team</p>
                </div>
            </div>
        </footer>
    )
}

/* ============================================
   HOME PAGE
   ============================================ */

export default function HomePage() {
    return (
        <main className="flex-1">
            <HeroSection />
            <FeaturesSection />
            <DemoSection />
            <AdaptersSection />
            <FooterSection />
        </main>
    )
}
