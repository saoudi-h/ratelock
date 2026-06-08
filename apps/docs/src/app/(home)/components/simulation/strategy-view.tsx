'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { resetSimulationAtom, updateConfigAtom } from '@/simulation/atoms'
import {
    type FixedWindowConfig,
    type IndividualFixedWindowConfig,
    type SlidingWindowConfig,
    type StrategyId,
    type TokenBucketConfig,
} from '@/simulation/types'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfigPanel } from './controls'
import { DynamicCodeExplorer } from './dynamic-code-explorer'
import { FixedWindowTimeline } from './fixed-window-timeline'
import { IndividualFixedWindowTimeline } from './individual-fixed-window-timeline'
import { Projectile } from './projectile'
import { SimulationControls } from './simulation-controls'
import { SlidingWindowTimeline } from './sliding-window-timeline'
import { TokenBucketTimeline } from './token-bucket-timeline'
import { useSimulation } from './use-simulation'

interface StrategyViewProps {
    strategyId: StrategyId
}

interface Projectile {
    id: string
    type: 'manual' | 'auto'
    startX: number
    startY: number
    destX: number | string
    destY: number
}

export function StrategyView({ strategyId }: StrategyViewProps) {
    const [projectiles, setProjectiles] = useState<Projectile[]>([])
    const [isCodeOpen, setIsCodeOpen] = useState(false)
    const sendRequestRef = useRef<(() => Promise<any>) | null>(null)

    // Refs for precise DOM measurements
    const containerRef = useRef<HTMLDivElement>(null)
    const timelineContainerRef = useRef<HTMLDivElement>(null)
    const autoToggleRef = useRef<HTMLDivElement>(null)
    const sendButtonRef = useRef<HTMLButtonElement>(null)

    // Calculate robust start coordinates based on actual DOM elements
    const getStartPos = (type: 'manual' | 'auto') => {
        const containerRect = containerRef.current?.getBoundingClientRect()
        const sourceRect =
            type === 'manual'
                ? sendButtonRef.current?.getBoundingClientRect()
                : autoToggleRef.current?.getBoundingClientRect()

        if (containerRect && sourceRect) {
            return {
                x: sourceRect.left - containerRect.left + sourceRect.width / 2,
                y: containerRect.bottom - sourceRect.top, // Distance from bottom
            }
        }

        // Fallbacks
        return { x: type === 'manual' ? window.innerWidth / 2 : 80, y: 30 }
    }

    const getDestPos = (isToken: boolean) => {
        const containerRect = containerRef.current?.getBoundingClientRect()
        const timelineRect = timelineContainerRef.current?.getBoundingClientRect()

        if (containerRect && timelineRect) {
            const baseDestX = timelineRect.left - containerRect.left + timelineRect.width / 2
            const destX = isToken && window.innerWidth >= 1024 ? baseDestX + 67.5 : baseDestX
            const destY = containerRect.bottom - (timelineRect.top + timelineRect.height / 2)

            return { destX, destY }
        }

        // Fallbacks
        return {
            destX: isToken && window.innerWidth >= 1024 ? 'calc(50% + 67.5px)' : '50%',
            destY: 160,
        }
    }

    const handleAutoTrigger = useCallback(() => {
        const { x, y } = getStartPos('auto')
        const { destX, destY } = getDestPos(strategyId === 'token-bucket')
        const id = `projectile-${Date.now()}-${Math.random()}`
        setProjectiles(prev => [...prev, { id, type: 'auto', startX: x, startY: y, destX, destY }])

        setTimeout(async () => {
            if (sendRequestRef.current) {
                await sendRequestRef.current()
            }
        }, 180)

        setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== id))
        }, 500)
    }, [])

    const {
        events,
        autoRequests,
        setAutoRequests,
        autoInterval,
        setAutoInterval,
        sendRequest,
        config,
    } = useSimulation(strategyId, handleAutoTrigger)

    useEffect(() => {
        sendRequestRef.current = sendRequest
    }, [sendRequest])

    const resetSimulation = useSetAtom(resetSimulationAtom)
    const updateConfig = useSetAtom(updateConfigAtom)

    const [isDark, setIsDark] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)

    const startTimeRef = useRef<number | null>(null)
    if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
    }
    const startTime = startTimeRef.current

    useEffect(() => {
        const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
        checkDark()
        checkDesktop()

        const observer = new MutationObserver(checkDark)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        window.addEventListener('resize', checkDesktop)

        return () => {
            observer.disconnect()
            window.removeEventListener('resize', checkDesktop)
        }
    }, [])

    const handleSendRequest = useCallback(async () => {
        const { x, y } = getStartPos('manual')
        const { destX, destY } = getDestPos(strategyId === 'token-bucket')
        const id = `projectile-${Date.now()}-${Math.random()}`
        setProjectiles(prev => [
            ...prev,
            { id, type: 'manual', startX: x, startY: y, destX, destY },
        ])

        setTimeout(async () => {
            await sendRequest()
        }, 180)

        setTimeout(() => {
            setProjectiles(prev => prev.filter(p => p.id !== id))
        }, 500)
    }, [sendRequest])

    const handleReset = async () => {
        await resetSimulation(strategyId)
    }

    const lastEvent = events[events.length - 1]

    return (
        <div className="w-full space-y-6" ref={containerRef}>
            <Card
                className="
                  rounded-3xl border border-border/40 bg-card/70 py-0
                  shadow-sm ring-0 overflow-hidden backdrop-blur-md
                ">
                <CardContent className="p-6 relative flex flex-col items-stretch gap-6">
                    {/* Compact Parameters Grid in the Bento Box */}
                    <div className="flex flex-col gap-2 pb-2 border-b border-border/20">
                        <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                            Parameters
                        </span>
                        <ConfigPanel
                            config={config}
                            onConfigChange={updates => updateConfig(strategyId, updates)}
                        />
                    </div>

                    {/* Timeline render area */}
                    <div className="w-full relative" ref={timelineContainerRef}>
                        {strategyId === 'fixed-window' && (
                            <FixedWindowTimeline
                                events={events}
                                config={config as FixedWindowConfig}
                                lastResult={
                                    lastEvent?.result as
                                        | { remaining: number; reset: number }
                                        | undefined
                                }
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'sliding-window' && (
                            <SlidingWindowTimeline
                                events={events}
                                config={config as SlidingWindowConfig}
                                lastResult={
                                    lastEvent?.result as
                                        | {
                                              remaining: number
                                              windowStart: number
                                              windowEnd: number
                                          }
                                        | undefined
                                }
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'token-bucket' && (
                            <TokenBucketTimeline
                                events={events}
                                config={config as TokenBucketConfig}
                                lastResult={
                                    lastEvent?.result as
                                        | { remaining: number; tokens: number; refillTime: number }
                                        | undefined
                                }
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'individual-fixed-window' && (
                            <IndividualFixedWindowTimeline
                                events={events}
                                config={config as IndividualFixedWindowConfig}
                                lastResult={
                                    lastEvent?.result as
                                        | { remaining: number; reset: number }
                                        | undefined
                                }
                                startTime={startTime}
                            />
                        )}
                    </div>

                    {/* Programmatic Projectile Particle Animations (CSS keyframes) */}
                    {projectiles.map(p => (
                        <Projectile
                            key={p.id}
                            id={p.id}
                            startX={p.startX}
                            startY={p.startY}
                            destX={p.destX}
                            destY={p.destY}
                        />
                    ))}

                    {/* Extracted Simulation Controls component */}
                    <SimulationControls
                        autoRequests={autoRequests}
                        setAutoRequests={setAutoRequests}
                        autoInterval={autoInterval}
                        setAutoInterval={setAutoInterval}
                        onSendRequest={handleSendRequest}
                        onViewCode={() => setIsCodeOpen(true)}
                        onReset={handleReset}
                        autoToggleRef={autoToggleRef}
                        sendButtonRef={sendButtonRef}
                    />
                </CardContent>
            </Card>

            {/* Code Modal Dialog */}
            <Dialog open={isCodeOpen} onOpenChange={setIsCodeOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-4 rounded-3xl">
                    <DialogHeader className="pb-1 border-b border-border/20">
                        <DialogTitle className="text-base font-bold tracking-tight">
                            API Implementation Example
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Below is the accurate initialization and integration snippet for this
                            rate limiting strategy using the @ratelock/local engine.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto rounded-xl">
                        <DynamicCodeExplorer
                            strategyId={strategyId}
                            config={config}
                            isDark={isDark}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
