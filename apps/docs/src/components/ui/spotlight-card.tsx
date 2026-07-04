'use client'

import { useRef, useState, type MouseEvent, type ReactNode } from 'react'

interface SpotlightCardProps {
    children: ReactNode
    className?: string
}

export function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState({ x: 0, y: 0 })
    const [isFocused, setIsFocused] = useState(false)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setCoords({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsFocused(true)}
            onMouseLeave={() => setIsFocused(false)}
            className={`
              relative overflow-hidden rounded-2xl border border-border/70
              bg-card p-8 transition-all duration-300
              hover:border-primary/20 hover:shadow-lg
              ${className}
            `}>
            {isFocused && (
                <div
                    className="
                      pointer-events-none absolute -inset-px rounded-2xl
                      transition-opacity duration-300
                    "
                    style={{
                        background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, var(--color-primary-rgb, oklch(0.70 0.20 160 / 10%)), transparent 80%)`,
                    }}
                />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    )
}
