'use client'

import { useMemo, useState, useEffect } from 'react'
import type { RequestEvent, TokenBucketConfig } from '@/simulation/types'
import { UnifiedTimelineBase } from './unified-timeline'
import { useNow } from './use-simulation'

interface TokenBucketTimelineProps {
    events: RequestEvent[]
    config: TokenBucketConfig
    lastResult?: { remaining: number; tokens: number; refillTime: number }
    startTime: number
}

function formatMs(ms: number): string {
    if (ms <= 0) return '0ms'
    if (ms < 1000) return `${ms}ms`
    return `${Math.round(ms / 100) / 10}s`
}

export function TokenBucketTimeline({
    events,
    config,
    lastResult,
    startTime,
}: TokenBucketTimelineProps) {
    const now = useNow(100)
    const { capacity, refillRate } = config
    const timelineSpan = Math.max(2500, capacity * 900)

    const [expelledTokens, setExpelledTokens] = useState<{ id: string; left: number }[]>([])

    useEffect(() => {
        if (events.length > 0) {
            const lastEvent = events[events.length - 1]
            if (lastEvent && lastEvent.allowed && lastEvent.timestamp > Date.now() - 500) {
                const id = `expelled-${lastEvent.id}`
                const leftOffset = 8 + Math.random() * 48
                setExpelledTokens(prev => [...prev, { id, left: leftOffset }])
                setTimeout(() => {
                    setExpelledTokens(prev => prev.filter(t => t.id !== id))
                }, 800)
            }
        }
    }, [events])

    const currentTokens = useMemo(() => {
        let tokens = lastResult?.tokens ?? capacity
        if (lastResult && events.length > 0) {
            const lastEvent = events[events.length - 1]
            if (lastEvent) {
                const timeElapsed = now - lastEvent.timestamp
                const refilled = timeElapsed * (refillRate / 1000)
                tokens = Math.min(capacity, tokens + refilled)
            }
        }
        return Math.max(0, Math.floor(tokens * 100) / 100)
    }, [events, now, lastResult, capacity, refillRate])

    const allowedCount = events.filter((e) => e.allowed).length
    const deniedCount = events.length - allowedCount
    const refillTimeMs = lastResult?.refillTime ? Math.max(0, lastResult.refillTime) : 0
    const tokenPercent = (currentTokens / capacity) * 100
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference * (1 - tokenPercent / 100)

    return (
        <div className="
          grid items-stretch gap-4
          lg:grid-cols-[135px_minmax(0,1fr)]
        ">
            <div className="
              flex h-[184px] w-full flex-col items-center justify-between rounded-xl border
              border-border/70 bg-card/40 p-3 shadow-xs relative overflow-hidden backdrop-blur-md
            ">
                <style>{`
                  @keyframes token-enter {
                    0% {
                      transform: translateY(-40px) scale(0.3);
                      opacity: 0;
                    }
                    70% {
                      transform: translateY(2px) scale(1.15);
                      opacity: 0.9;
                    }
                    100% {
                      transform: translateY(0) scale(1);
                      opacity: 1;
                    }
                  }
                  .animate-token-enter {
                    animation: token-enter 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                  }

                  @keyframes token-exit {
                    0% {
                      transform: translateY(-10px) scale(1);
                      opacity: 1;
                      filter: brightness(1.3) drop-shadow(0 0 6px rgba(16, 185, 129, 0.9));
                    }
                    100% {
                      transform: translateY(45px) scale(0.2);
                      opacity: 0;
                    }
                  }
                  .animate-token-exit {
                    animation: token-exit 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                  }
                `}</style>

                <div className="text-center space-y-0.5">
                    <div className="text-[9px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                        Tokens
                    </div>
                    <div className="font-mono text-sm font-bold tabular-nums text-foreground flex items-baseline justify-center">
                        <span>{Math.floor(currentTokens)}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">/{capacity}</span>
                    </div>
                </div>

                <div 
                    className="relative w-16 border-2 border-border/60 bg-muted/15 rounded-b-2xl flex flex-col-reverse items-center justify-start pb-2.5 px-2 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]"
                    style={{
                        height: '116px',
                        gap: capacity <= 6 ? '6px' : capacity <= 10 ? '4px' : '2px'
                    }}
                >
                    {/* Remplissage liquide en arrière-plan */}
                    <div 
                        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-500/25 to-emerald-500/5 transition-all duration-300 ease-out pointer-events-none rounded-b-xl"
                        style={{ height: `${tokenPercent}%` }}
                    />

                    {Array.from({ length: capacity }).map((_, index) => {
                        const slotNumber = index + 1
                        const isFull = slotNumber <= Math.floor(currentTokens)
                        const isRefilling = slotNumber === Math.floor(currentTokens) + 1
                        const refillPercent = currentTokens % 1
                        
                        const sizeClass = capacity <= 6 
                            ? 'size-3.5' 
                            : capacity <= 10 
                              ? 'size-2.5' 
                              : 'size-2'
                        
                        return (
                            <div 
                                key={index} 
                                className="relative flex items-center justify-center z-10"
                            >
                                {isFull ? (
                                    <div 
                                        className={`
                                            rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-token-enter
                                            ${sizeClass}
                                        `}
                                    />
                                ) : isRefilling ? (
                                    <div 
                                        className={`
                                            rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse transition-all duration-300
                                            ${sizeClass}
                                        `}
                                        style={{ 
                                            opacity: refillPercent,
                                            transform: `scale(${0.6 + refillPercent * 0.4})`
                                        }}
                                    />
                                ) : (
                                    <div 
                                        className={`
                                            rounded-full border border-dashed border-muted-foreground/30 bg-transparent transition-all duration-300
                                            ${sizeClass}
                                        `}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Billes de jetons expulsées qui tombent à l'extérieur du becher */}
                {expelledTokens.map((t) => (
                    <div 
                        key={t.id}
                        className="absolute z-30 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-token-exit pointer-events-none"
                        style={{
                            bottom: '12px',
                            left: `calc(50% - 32px + ${t.left}px)`,
                            width: capacity <= 6 ? '14px' : capacity <= 10 ? '10px' : '8px',
                            height: capacity <= 6 ? '14px' : capacity <= 10 ? '10px' : '8px',
                        }}
                    />
                ))}
            </div>

            <div className="min-w-0">
                <UnifiedTimelineBase
                    events={events}
                    timelineSpan={timelineSpan}
                    startTime={startTime}
                >
                    {/* Floating HUD Left */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-30 select-none">
                        <span className="
                          inline-flex items-center gap-1.5 rounded-md border
                          border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                          text-muted-foreground shadow-2xs
                        ">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            Total: <span className="font-mono text-foreground font-bold">{events.length}</span>
                        </span>
                        <span className="
                          inline-flex items-center gap-1.5 rounded-md border
                          border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                          text-emerald-500/90 shadow-2xs
                        ">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Allowed: <span className="font-mono text-foreground font-bold">{allowedCount}</span>
                        </span>
                        <span className="
                          inline-flex items-center gap-1.5 rounded-md border
                          border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                          text-rose-500/90 shadow-2xs
                        ">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Denied: <span className="font-mono text-foreground font-bold">{deniedCount}</span>
                        </span>
                    </div>

                    {/* Floating HUD Right */}
                    <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-30 select-none">
                        <span className="
                          inline-flex items-center gap-1 rounded-md border border-border/40
                          bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                        ">
                            Capacity: <span className="text-foreground font-bold">{capacity}</span>
                        </span>
                        <span className="
                          inline-flex items-center gap-1 rounded-md border border-border/40
                          bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                        ">
                            Refill: <span className="text-foreground font-bold">{refillRate}/s</span>
                        </span>
                        <span className="
                          inline-flex items-center gap-1 rounded-md border border-border/40
                          bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                        ">
                            Next token: <span className="text-foreground font-bold tabular-nums">{formatMs(refillTimeMs)}</span>
                        </span>
                    </div>
                </UnifiedTimelineBase>
            </div>
        </div>
    )
}
