'use client'

import { useEffect, useRef } from 'react'

import { restartCssAnimation } from '../../_lib/css-animation'
import { registerReplay } from '../../_lib/replay-registry'

/**
 * The little "v0.2 · Open Source" pill at the top of the hero.
 * Drops in with a small blur-in (CSS only, see `.hero-animate`).
 */
export function HeroBadge() {
    const ref = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        return registerReplay(() => restartCssAnimation(el))
    }, [])

    return (
        <span
            ref={ref}
            className="
              hero-animate hero-badge inline-flex items-center gap-2 rounded-xl border
              border-border/40 bg-card/50 px-3 py-1.5 font-mono text-xs font-semibold
              text-muted-foreground shadow-xs select-none
            ">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            v0.2 • Open Source
        </span>
    )
}
