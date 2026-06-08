'use client'

import type { CSSProperties } from 'react'

interface ProjectileProps {
    id: string
    startX: number
    startY: number
    destX: number | string
    destY: number
}

const NUM = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)

/**
 * One fly-to-the-timeline particle. Pure CSS keyframe animation —
 * the parent just mounts it and unmounts it ~500ms later.
 *
 * Replacing the previous `framer-motion` `motion.div` + `AnimatePresence`
 * pair: the visual is identical (3 keyframes, 380ms easeOut) and the
 * animation runs on the compositor without occupying JS each frame.
 */
export function Projectile({ startX, startY, destX, destY }: ProjectileProps) {
    return (
        <span
            aria-hidden
            className="projectile pointer-events-none absolute z-40 block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.85)]"
            style={
                {
                    left: NUM(startX),
                    bottom: NUM(startY),
                    '--projectile-start-x': NUM(startX),
                    '--projectile-start-y': NUM(startY),
                    '--projectile-dest-x': NUM(destX),
                    '--projectile-dest-y': NUM(destY),
                } as CSSProperties
            }
        />
    )
}
