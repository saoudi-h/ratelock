'use client'

import { useGSAP } from '@gsap/react'
import { useEffect, useRef, useState } from 'react'
import { createHighlighter } from 'shiki'
import { gsap, registerGsap } from '../_lib/gsap'

const codeExamples = [
    {
        package: '@ratelock/local',
        file: 'local-setup.ts',
        code: `import { fixedWindow } from '@ratelock/local'

const limiter = await fixedWindow({
  limit: 100,
  windowMs: 60_000,
})

const { allowed, remaining } = await limiter.check('user:123')`,
    },
    {
        package: '@ratelock/redis',
        file: 'redis-setup.ts',
        code: `import { slidingWindow } from '@ratelock/redis'
import { createClient } from 'redis'

const redis = createClient({ url: 'redis://...' })
await redis.connect()

const limiter = await slidingWindow({
  client: redis,
  limit: 50,
  windowMs: 30_000,
})`,
    },
    {
        package: '@ratelock/postgres',
        file: 'postgres-setup.ts',
        code: `import { tokenBucket } from '@ratelock/postgres'
import postgres from 'postgres'

const sql = postgres('postgres://...')

const limiter = await tokenBucket({
  sql,
  capacity: 200,
  refillRate: 10,
})`,
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

interface AnimatedCodePanelProps {
    /** Auto-cycle the snippets — disable on tabs/menus when not in view */
    autoplay?: boolean
}

export function AnimatedCodePanel({ autoplay = true }: AnimatedCodePanelProps) {
    registerGsap()
    const [index, setIndex] = useState(0)
    const [html, setHtml] = useState('')
    const [isDark, setIsDark] = useState(false)
    const codeRef = useRef<HTMLDivElement>(null)
    const dotsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
        checkDark()
        const observer = new MutationObserver(checkDark)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let cancelled = false
        const current = codeExamples[index]
        if (!current) return

        getHighlighter().then(highlighter => {
            if (cancelled) return
            setHtml(
                highlighter.codeToHtml(current.code, {
                    lang: 'typescript',
                    theme: isDark ? 'github-dark' : 'github-light',
                })
            )
        })

        return () => {
            cancelled = true
        }
    }, [index, isDark])

    useEffect(() => {
        if (!autoplay) return
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % codeExamples.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [autoplay])

    // Animate snippet on every index / theme change. Shiki wraps
    // each line in <span class="line">; we stagger those for a
    // "code being typed" feel. Fall back to a simple crossfade
    // when the spans aren't present.
    useGSAP(
        () => {
            if (!codeRef.current) return
            const lines = codeRef.current.querySelectorAll<HTMLElement>('span.line')
            if (lines.length > 0) {
                gsap.fromTo(
                    lines,
                    { opacity: 0, y: 4, filter: 'blur(1.5px)' },
                    {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.45,
                        ease: 'power2.out',
                        stagger: 0.035,
                    }
                )
            } else {
                gsap.fromTo(
                    codeRef.current,
                    { opacity: 0, y: 6, filter: 'blur(2px)' },
                    {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.45,
                        ease: 'power2.out',
                    }
                )
            }
        },
        { dependencies: [html] }
    )

    return (
        <div
            className="
              w-full overflow-hidden rounded-xl border border-border bg-background
              shadow-xs select-text
            ">
            {/* macOS window title bar */}
            <div
                className="
                  relative flex items-center justify-between border-b border-border
                  bg-muted/80 px-4 py-3 select-none
                ">
                <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-full bg-[#ff5f56]" />
                    <span className="size-3 rounded-full bg-[#ffbd2e]" />
                    <span className="size-3 rounded-full bg-[#27c93f]" />
                </div>

                <div
                    className="
                      pointer-events-none absolute left-1/2 flex -translate-x-1/2
                      items-center gap-1.5
                    ">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5 text-muted-foreground/75">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                        {codeExamples[index]?.file}
                    </span>
                </div>

                <span
                    className="
                      rounded-md border border-border bg-background px-2 py-0.5
                      font-mono text-[9px] font-bold tracking-[0.08em]
                      text-muted-foreground/80 uppercase select-none
                    ">
                    TypeScript
                </span>
            </div>

            <div
                className="
                  flex h-[180px] flex-col justify-start overflow-hidden bg-background
                  p-5 text-[13px]
                ">
                <div
                    ref={codeRef}
                    className="
                      text-left
                      [&_code]:font-mono! [&_code]:text-[13px]!
                      [&_code]:leading-relaxed!
                      [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0!
                    "
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>

            <div
                ref={dotsRef}
                className="flex items-center gap-1.5 border-t border-border bg-muted px-4 py-2.5">
                {codeExamples.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Show snippet ${i + 1}`}
                        className={`
                          h-1.5 cursor-pointer rounded-full transition-all duration-300
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
