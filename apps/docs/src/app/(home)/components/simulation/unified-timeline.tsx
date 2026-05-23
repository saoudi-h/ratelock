'use client'

import { useMemo, useRef, useEffect } from 'react'
import type { RequestEvent } from '@/simulation/types'

export interface TimelineWindow {
    id: string
    start: number
    end: number
    isCurrent?: boolean
    isPast?: boolean
    isFuture?: boolean
    eventCount?: number
    limit?: number
    label?: string
    isStatic?: boolean
}

interface UnifiedTimelineBaseProps {
    events: RequestEvent[]
    windows?: TimelineWindow[]
    timelineSpan: number
    height?: number
    className?: string
    accentByEvent?: (event: RequestEvent) => string
    startTime?: number
}

const DEFAULT_ALLOWED = 'border-emerald-500 bg-emerald-500/25 text-emerald-400'
const DEFAULT_DENIED = 'border-rose-500 bg-rose-500/30 text-rose-400'

export function UnifiedTimelineBase({
    events,
    windows = [],
    timelineSpan,
    height = 184,
    className,
    accentByEvent,
    startTime,
}: UnifiedTimelineBaseProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    
    // Origine temporelle stable pour le système de coordonnées
    const simulationStartTimeRef = useRef<number | null>(null)
    if (simulationStartTimeRef.current === null) {
        simulationStartTimeRef.current = startTime ?? Date.now()
    }
    const simulationStartTime = simulationStartTimeRef.current

    // Positionnement statique des événements relatif à simulationStartTime
    const positionedEvents = useMemo(() => {
        return events.map((event) => {
            const left = ((event.timestamp - simulationStartTime) / timelineSpan) * 100
            const accent =
                accentByEvent?.(event) ??
                (event.allowed ? DEFAULT_ALLOWED : DEFAULT_DENIED)
            return { event, left, accent }
        })
    }, [events, timelineSpan, simulationStartTime, accentByEvent])

    // Positionnement statique des fenêtres relatif à simulationStartTime (uniquement non-statiques)
    const positionedWindows = useMemo(() => {
        return windows
            .filter((window) => !window.isStatic)
            .map((window) => {
                const left = ((window.start - simulationStartTime) / timelineSpan) * 100
                const width = ((window.end - window.start) / timelineSpan) * 100
                return { ...window, left, width }
            })
    }, [windows, timelineSpan, simulationStartTime])

    // Fenêtres statiques (ex: Sliding Window) qui restent immobiles par rapport à "now"
    const staticWindows = useMemo(() => {
        return windows
            .filter((window) => window.isStatic)
            .map((window) => {
                const duration = window.end - window.start
                const width = (duration / timelineSpan) * 100
                // La fin de la fenêtre glissante correspond exactement au milieu (now = 50%)
                const left = 50 - width
                return { ...window, left, width }
            })
    }, [windows, timelineSpan])

    // Boucle d'animation GPU découplée de React
    useEffect(() => {
        let frameId: number
        
        const tick = () => {
            const container = scrollContainerRef.current
            if (container) {
                const now = Date.now()
                // Le centre de la frise correspond à 'now'.
                // Donc le bord gauche correspond à now - timelineSpan / 2
                const elapsed = now - timelineSpan / 2 - simulationStartTime
                const translationPercent = -(elapsed / timelineSpan) * 100
                
                // Utilisation de translate3d pour forcer le GPU Composite Layer
                container.style.transform = `translate3d(${translationPercent}%, 0, 0)`
            }
            frameId = requestAnimationFrame(tick)
        }
        
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [timelineSpan, simulationStartTime])

    return (
        <div
            className={`
              relative overflow-hidden rounded-xl border border-border/80
              bg-background/40 backdrop-blur-xs shadow-inner
              ${className ?? ''}
            `}
            style={{ height }}
        >
            {/* Grille d'arrière-plan statique de la simulation */}
            <div className="
              simulation-grid pointer-events-none absolute inset-0 opacity-20 dark:opacity-30
            " />
            
            {/* Ligne verticale de repère central (Now) */}
            <div className="
              pointer-events-none absolute inset-y-0 left-1/2 w-px
              -translate-x-1/2 bg-primary/30 z-10
            " />
            <div className="
              pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2
              rounded-full border border-primary/20 bg-background/90 px-2 py-0.5 font-mono text-[9px]
              font-semibold tracking-[0.16em] text-primary uppercase shadow-sm z-10
            ">
                now
            </div>

            {/* Fenêtres temporelles statiques (ex: Sliding Window) - Immobiles */}
            {staticWindows.map((window) => {
                const tone = 'border-primary/45 bg-primary/[0.04]'
                return (
                    <div
                        key={window.id}
                        className={`
                          absolute inset-y-4 border-l border-r border-dashed rounded-lg z-0
                          ${tone}
                        `}
                        style={{
                            left: `${window.left}%`,
                            width: `${window.width}%`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-2 p-3">
                            {window.label ? (
                                <p className="
                                  text-[9px] font-semibold tracking-[0.12em]
                                  text-muted-foreground/80 uppercase
                                ">
                                    {window.label}
                                </p>
                            ) : null}
                            {window.eventCount !== undefined && window.limit !== undefined ? (
                                <div className="
                                  rounded-md border border-border/40 bg-background/95 px-1.5 py-0.5 font-mono
                                  text-[9px] text-muted-foreground shadow-xs
                                ">
                                    <span className={window.eventCount > window.limit ? `
                                      text-rose-500 font-bold
                                    ` : `text-foreground font-semibold`}>
                                        {window.eventCount}
                                    </span>{' '}
                                    / <span className="font-semibold">{window.limit}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            })}

            {/* Balise de style pour injecter l'animation de popping des requêtes */}
            <style>{`
              @keyframes event-pop {
                0% {
                  scale: 0;
                }
                60% {
                  scale: 1.2;
                }
                100% {
                  scale: 1;
                }
              }
              .animate-event-pop {
                animation: event-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
            `}</style>

            {/* Conteneur défilant à 60fps géré par GPU */}
            <div
                ref={scrollContainerRef}
                className="absolute inset-0 will-change-transform z-10"
                style={{ width: '100%' }}
            >
                {/* Couche des fenêtres temporelles */}
                {positionedWindows.map((window) => {
                    const tone = window.isCurrent
                        ? 'border-2 border-primary bg-primary/[0.06] shadow-[inset_0_0_12px_rgba(59,130,246,0.1)] z-20'
                        : window.isPast
                          ? 'border border-dashed border-muted-foreground/45 bg-muted/[0.06] text-muted-foreground/70'
                          : 'border border-dashed border-muted-foreground/25 bg-muted/[0.02] text-muted-foreground/50'

                    return (
                        <div
                            key={window.id}
                            className={`
                               absolute inset-y-4 rounded-lg transition-all duration-300
                               ${tone}
                             `}
                            style={{
                                left: `${window.left}%`,
                                width: `${window.width}%`,
                            }}
                        >
                            <div className="flex items-start justify-between gap-2 p-3">
                                {window.label ? (
                                    <p className="
                                      text-[9px] font-bold tracking-[0.12em]
                                      text-muted-foreground uppercase
                                    ">
                                        {window.label}
                                    </p>
                                ) : null}
                                {window.eventCount !== undefined && window.limit !== undefined ? (
                                    <div className="
                                      rounded-md border border-border/40 bg-background/95 px-1.5 py-0.5 font-mono
                                      text-[9px] text-muted-foreground shadow-xs
                                    ">
                                        <span className={window.eventCount > window.limit ? `
                                          text-rose-500 font-bold
                                        ` : `text-foreground font-semibold`}>
                                            {window.eventCount}
                                        </span>{' '}
                                        / <span className="font-semibold">{window.limit}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                })}

                {/* Séparateur horizontal de frise */}
                <div className="
                  pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border/40
                " />

                {/* Couche des points d'événements */}
                {positionedEvents.map(({ event, left, accent }) => {
                    const isNew = Date.now() - event.timestamp < 600

                    return (
                        <div
                            key={event.id}
                            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 duration-150 cursor-help z-30 ${
                                isNew ? 'animate-event-pop' : ''
                            }`}
                            style={{ left: `${left}%` }}
                            title={`${event.allowed ? 'allowed' : 'denied'} · ${event.remaining} remaining · User: ${event.userId}`}
                        >
                            <div className={`
                              size-3.5 rounded-full border-2 shadow-xs
                              ${accent}
                            `} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
