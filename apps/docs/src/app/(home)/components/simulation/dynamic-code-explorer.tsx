'use client'

import { Button } from '@/components/ui/button'
import type { StrategyId } from '@/simulation/types'
import { useEffect, useMemo, useState } from 'react'
import { createHighlighter } from 'shiki'

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

interface DynamicCodeExplorerProps {
    strategyId: StrategyId
    config: any
    isDark: boolean
}

export function DynamicCodeExplorer({ strategyId, config, isDark }: DynamicCodeExplorerProps) {
    const [html, setHtml] = useState('')
    const [copied, setCopied] = useState(false)

    const code = useMemo(() => {
        switch (strategyId) {
            case 'fixed-window':
                return `import { fixedWindow } from '@ratelock/local'

const limiter = fixedWindow({
  limit: ${config.limit},
  windowMs: ${config.windowMs}, // ${(config.windowMs / 1000).toFixed(1)}s
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Remaining:', result.remaining)
}`
            case 'sliding-window':
                return `import { slidingWindow } from '@ratelock/local'

const limiter = slidingWindow({
  limit: ${config.limit},
  windowMs: ${config.windowMs}, // ${(config.windowMs / 1000).toFixed(1)}s
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Remaining:', result.remaining)
}`
            case 'token-bucket':
                return `import { tokenBucket } from '@ratelock/local'

const limiter = tokenBucket({
  capacity: ${config.capacity},
  refillRate: ${config.refillRate}, // per second
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Tokens:', result.remaining)
}`
            case 'individual-fixed-window':
                return `import { individualFixedWindow } from '@ratelock/local'

const limiter = individualFixedWindow({
  limit: ${config.limit},
  windowMs: ${config.windowMs}, // ${(config.windowMs / 1000).toFixed(1)}s
})

// Dynamic window starts at user's first request
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Remaining:', result.remaining)
}`
            default:
                return ''
        }
    }, [strategyId, config])

    useEffect(() => {
        let cancelled = false
        getHighlighter().then(highlighter => {
            if (cancelled) return
            const result = highlighter.codeToHtml(code, {
                lang: 'typescript',
                theme: isDark ? 'github-dark' : 'github-light',
            })
            setHtml(result)
        })
        return () => {
            cancelled = true
        }
    }, [code, isDark])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="
          w-full overflow-hidden rounded-xl border border-border bg-background
          shadow-xs select-text
        ">
            {/* Unified macOS-style header */}
            <div className="
              relative flex items-center justify-between border-b border-border
              bg-muted/80 px-4 py-3 select-none
            ">
                {/* macOS traffic light controls */}
                <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-full bg-[#ff5f56]" />
                    <span className="size-3 rounded-full bg-[#ffbd2e]" />
                    <span className="size-3 rounded-full bg-[#27c93f]" />
                </div>

                {/* File title centered perfectly */}
                <div className="
                  pointer-events-none absolute left-1/2 flex -translate-x-1/2
                  items-center gap-1.5
                ">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
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
                    <span className="
                      font-mono text-xs font-bold text-muted-foreground
                    ">
                        api.ts
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                    <span className="
                      rounded-md border border-border bg-background px-2 py-0.5
                      font-mono text-[9px] font-bold tracking-[0.08em]
                      text-muted-foreground/80 uppercase select-none
                    ">
                        TypeScript
                    </span>
                    <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={handleCopy}
                        className="
                          rounded-md text-muted-foreground
                          hover:text-foreground
                        "
                        title="Copy Code">
                        {copied ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3.5 text-emerald-500">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-3.5">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        )}
                    </Button>
                </div>
            </div>

            {/* Code Body */}
            <div className="overflow-auto bg-background p-5 text-[13px]">
                <div
                    className="
                      text-left font-mono leading-relaxed
                      [&_code]:font-mono! [&_code]:text-[13px]!
                      [&_code]:leading-relaxed!
                      [&>pre]:m-0! [&>pre]:bg-transparent! [&>pre]:p-0!
                    "
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </div>
    )
}
