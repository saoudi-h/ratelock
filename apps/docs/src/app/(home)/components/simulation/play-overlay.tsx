'use client'

import { cn } from "@/lib/utils"
import { Play } from "@solar-icons/react-perf/category/style/BoldDuotone"
import styles from "./play-overlay.module.css"

interface PlayOverlayProps {
    onPlay: () => void
}

export function PlayOverlay({ onPlay }: PlayOverlayProps) {
    return (
        <div
            className="
              group absolute inset-0 z-50 flex cursor-pointer items-center
              justify-center bg-background/50 backdrop-blur-[2px]
              transition-opacity duration-300
            "
            style={{ borderRadius: 'inherit' }}
            onClick={onPlay}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onPlay()
                }
            }}
            aria-label="Start simulation">

            {/* Ripple ring behind the button */}
            <div
              className={cn(
                styles.animatePlayRipple ,`
                  pointer-events-none absolute size-20 rounded-full border-2
                  border-emerald-500/30
                `)}
            />

            {/* Main play button */}
            <div
              className={cn(
                styles.animatePlayPulse, `
                  relative flex size-16 items-center justify-center rounded-full
                  bg-emerald-500/90 shadow-lg shadow-emerald-500/25
                  transition-all duration-200
                  group-hover:scale-110 group-hover:shadow-xl
                  group-hover:shadow-emerald-500/30
                  group-active:scale-95
                  hover:bg-emerald-500
                `)}>
                <Play
                  className="
                    ml-0.5 size-7 text-white transition-transform duration-200
                    group-hover:scale-125
                  "
                />
            </div>

            {/* Hint text */}
            <span
              className="
                absolute top-2/3 left-1/2 -translate-x-1/2 px-4 py-2 text-xs
                font-medium tracking-wide text-muted-foreground uppercase
              ">
              <span className="
                absolute inset-0 -z-10 rounded-full bg-background/50 blur-md
              "></span>
              <span className="
                opacity-70 transition-opacity duration-200
                group-hover:opacity-100
              ">Click to start</span>
            </span>
        </div>
    )
}
