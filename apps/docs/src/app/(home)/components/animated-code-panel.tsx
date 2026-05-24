'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { createHighlighter } from 'shiki'

const codeExamples = [
    {
        package: '@ratelock/local',
        strategy: 'fixedWindow',
        code: `import { fixedWindow } from '@ratelock/local'

const limiter = await fixedWindow({
  limit: 100,
  windowMs: 60_000,
})

const result = await limiter.check('user:123')

if (result.allowed) {
  // Request allowed
  console.log(result.remaining) // 99
}`,
    },
    {
        package: '@ratelock/redis',
        strategy: 'slidingWindow',
        code: `import { slidingWindow } from '@ratelock/redis'

const limiter = await slidingWindow({
  limit: 50,
  windowMs: 30_000,
  url: 'redis://localhost:6379',
})

const result = await limiter.check('api:endpoint')

if (result.allowed) {
  // Request allowed
  console.log(result.remaining) // 49
}`,
    },
    {
        package: '@ratelock/postgres',
        strategy: 'tokenBucket',
        code: `import { tokenBucket } from '@ratelock/postgres'

const limiter = await tokenBucket({
  capacity: 200,
  refillRate: 10,
  connectionString: 'postgres://...',
})

const result = await limiter.check('service:auth')

if (result.allowed) {
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
        <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-xs select-text">
            {/* macOS window title bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-3 relative select-none">
                {/* traffic lights */}
                <div className="flex gap-1.5 items-center">
                    <span className="size-3 rounded-full bg-[#ff5f56]" />
                    <span className="size-3 rounded-full bg-[#ffbd2e]" />
                    <span className="size-3 rounded-full bg-[#27c93f]" />
                </div>
                
                {/* centered file title */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground/75"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                        {codeExamples[index]?.package === '@ratelock/local' ? 'local-setup.ts' : codeExamples[index]?.package === '@ratelock/redis' ? 'redis-setup.ts' : 'postgres-setup.ts'}
                    </span>
                </div>

                {/* format badge */}
                <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-muted-foreground/80 bg-background border border-border px-2 py-0.5 rounded-md select-none font-mono">
                    TypeScript
                </span>
            </div>

            {/* code body */}
            <div className="bg-background p-5 text-[13px] overflow-auto h-[240px] flex flex-col justify-start">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="
                          text-left
                          [&_code]:font-mono! [&_code]:text-[13px]!
                          [&_code]:leading-relaxed!
                          [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0!
                        "
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </AnimatePresence>
            </div>

            {/* code slide indicators */}
            <div className="flex items-center gap-1.5 border-t border-border bg-muted px-4 py-2.5">
                {codeExamples.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`
                          h-1.5 rounded-full transition-all duration-300 cursor-pointer
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
