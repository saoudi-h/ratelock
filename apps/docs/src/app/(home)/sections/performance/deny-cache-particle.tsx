'use client'

import type { CSSProperties } from 'react'

interface DenyCacheParticleProps {
    color: 'emerald' | 'red'
    delay: string
    duration?: string
    end: string
    offset?: string
}

/**
 * Small CSS-driven particle used in the deny-cache visualization.
 * CSS-only on purpose: it runs forever in the background, never
 * blocks the main thread, and survives Fast Refresh cleanly.
 */
export function DenyCacheParticle({
    color,
    delay,
    duration = '1.05s',
    end,
    offset = '0px',
}: DenyCacheParticleProps) {
    return (
        <span
            className={`
              deny-cache-particle
              ${
                  color === 'emerald'
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
              }
            `}
            style={
                {
                    '--flow-delay': delay,
                    '--flow-duration': duration,
                    '--flow-end': end,
                    '--flow-x': offset,
                } as CSSProperties
            }
        />
    )
}
