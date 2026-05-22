'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { createHighlighter } from 'shiki'

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

export function AnimatedCodePanel() {
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

        return () => {
            cancelled = true
        }
    }, [index, isDark])

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % codeExamples.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="w-full overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
                <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-red-500" />
                    <div className="size-3 rounded-full bg-yellow-500" />
                    <div className="size-3 rounded-full bg-green-500" />
                </div>
            </div>

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

            <div className="flex items-center gap-1.5 border-t border-border bg-muted px-4 py-2.5">
                {codeExamples.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`
                          h-1.5 rounded-full transition-all duration-300
                          ${
                              i === index
                                  ? 'w-6 bg-primary'
                                  : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                          }
                        `}
                    />
                ))}
            </div>
        </div>
    )
}
