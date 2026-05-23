'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Send, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { ConfigPanel } from './controls'
import { Slider } from '@/components/ui/slider'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FixedWindowTimeline } from './fixed-window-timeline'
import { SlidingWindowTimeline } from './sliding-window-timeline'
import { TokenBucketTimeline } from './token-bucket-timeline'
import { IndividualFixedWindowTimeline } from './individual-fixed-window-timeline'
import { useSimulation } from './use-simulation'
import { activeStrategyAtom, resetSimulationAtom, updateConfigAtom } from '@/simulation/atoms'
import {
    STRATEGY_LABELS,
    STRATEGY_DESCRIPTIONS,
    type StrategyId,
    isTokenBucketConfig,
    type FixedWindowConfig,
    type SlidingWindowConfig,
    type TokenBucketConfig,
    type IndividualFixedWindowConfig,
} from '@/simulation/types'
import { createHighlighter } from 'shiki'
import { useCallback } from 'react'

const STRATEGIES: StrategyId[] = [
    'fixed-window',
    'sliding-window',
    'token-bucket',
    'individual-fixed-window',
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

function DynamicCodeExplorer({ strategyId, config, isDark }: { strategyId: StrategyId; config: any; isDark: boolean }) {
    const [html, setHtml] = useState('')
    const [copied, setCopied] = useState(false)

    const code = useMemo(() => {
        switch (strategyId) {
            case 'fixed-window':
                return `import { createFixedWindowLimiter } from '@ratelock/local'

const limiter = createFixedWindowLimiter({
  limit: ${config.limit},
  windowMs: ${config.windowMs}, // ${(config.windowMs / 1000).toFixed(1)}s
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Remaining:', result.remaining)
}`
            case 'sliding-window':
                return `import { createSlidingWindowLimiter } from '@ratelock/local'

const limiter = createSlidingWindowLimiter({
  limit: ${config.limit},
  windowMs: ${config.windowMs}, // ${(config.windowMs / 1000).toFixed(1)}s
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Remaining:', result.remaining)
}`
            case 'token-bucket':
                return `import { createTokenBucketLimiter } from '@ratelock/local'

const limiter = createTokenBucketLimiter({
  capacity: ${config.capacity},
  refillRate: ${config.refillRate}, // per second
})

// Check rate limit for a user
const result = await limiter.check('user:123')
if (result.allowed) {
  console.log('Allowed! Tokens:', result.remaining)
}`
            case 'individual-fixed-window':
                return `import { createIndividualFixedWindowLimiter } from '@ratelock/local'

const limiter = createIndividualFixedWindowLimiter({
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
        getHighlighter().then((highlighter) => {
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
        <div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-xs select-text">
            {/* Unified macOS-style header matching Hero Section perfectly */}
            <div className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-3 relative select-none">
                {/* macOS traffic light controls strictly grouped on the left */}
                <div className="flex gap-1.5 items-center">
                    <span className="size-3 rounded-full bg-[#ff5f56]" />
                    <span className="size-3 rounded-full bg-[#ffbd2e]" />
                    <span className="size-3 rounded-full bg-[#27c93f]" />
                </div>
                
                {/* File title centered perfectly in the header */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground/75"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                        api.ts
                    </span>
                </div>
                
                {/* Actions strictly grouped on the right */}
                <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-muted-foreground/80 bg-background border border-border px-2 py-0.5 rounded-md select-none font-mono">
                        TypeScript
                    </span>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="size-6 text-muted-foreground hover:text-foreground rounded-md transition-all duration-150 cursor-pointer"
                        title="Copy Code"
                    >
                        {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                    </Button>
                </div>
            </div>
            
            {/* Code Body matching the Hero Section's AnimatedCodePanel perfectly */}
            <div className="p-5 text-[13px] overflow-auto bg-background">
                <div 
                    className="
                      font-mono leading-relaxed text-left
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

function StrategyView({ strategyId }: { strategyId: StrategyId }) {
    const [projectiles, setProjectiles] = useState<{ id: string; type: 'manual' | 'auto' }[]>([])
    const [isCodeOpen, setIsCodeOpen] = useState(false)
    const sendRequestRef = useRef<(() => Promise<any>) | null>(null)

    const handleAutoTrigger = useCallback(() => {
        const id = `projectile-${Date.now()}-${Math.random()}`
        setProjectiles((prev) => [...prev, { id, type: 'auto' }])
        
        setTimeout(async () => {
            if (sendRequestRef.current) {
                await sendRequestRef.current()
            }
        }, 180)

        setTimeout(() => {
            setProjectiles((prev) => prev.filter((p) => p.id !== id))
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

    const startTimeRef = useRef<number | null>(null)
    if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
    }
    const startTime = startTimeRef.current

    useEffect(() => {
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'))
        }
        checkDark()
        const observer = new MutationObserver(checkDark)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const handleSendRequest = useCallback(async () => {
        const id = `projectile-${Date.now()}-${Math.random()}`
        setProjectiles((prev) => [...prev, { id, type: 'manual' }])
        
        setTimeout(async () => {
            await sendRequest()
        }, 180)

        setTimeout(() => {
            setProjectiles((prev) => prev.filter((p) => p.id !== id))
        }, 500)
    }, [sendRequest])

    const handleReset = async () => {
        await resetSimulation(strategyId)
    }

    const lastEvent = events[events.length - 1]

    return (
        <div className="w-full space-y-6">
            <Card
                className="
                  rounded-2xl border border-border/70 bg-card/70 py-0
                  shadow-none ring-0 overflow-hidden backdrop-blur-md
                "
            >
                <CardContent className="p-6 relative flex flex-col items-stretch gap-6">
                    <style>{`
                      @keyframes projectile-manual {
                        0% {
                          transform: translate(-50%, 0) scale(0.4);
                          bottom: 30px;
                          opacity: 0.1;
                        }
                        20% {
                          transform: translate(-50%, 0) scale(1.2);
                          opacity: 1;
                        }
                        100% {
                          transform: translate(-50%, 0) scale(0.3);
                          bottom: 200px;
                          opacity: 0;
                        }
                      }

                      @keyframes projectile-auto-standard {
                        0% {
                          left: 80px;
                          bottom: 30px;
                          transform: scale(0.4);
                          opacity: 0.1;
                        }
                        20% {
                          transform: scale(1.2);
                          opacity: 1;
                        }
                        100% {
                          left: 50%;
                          bottom: 200px;
                          transform: scale(0.3) translateX(-50%);
                          opacity: 0;
                        }
                      }

                      @keyframes projectile-auto-token-mobile {
                        0% {
                          left: 80px;
                          bottom: 30px;
                          transform: scale(0.4);
                          opacity: 0.1;
                        }
                        20% {
                          transform: scale(1.2);
                          opacity: 1;
                        }
                        100% {
                          left: 50%;
                          bottom: 200px;
                          transform: scale(0.3) translateX(-50%);
                          opacity: 0;
                        }
                      }

                      @keyframes projectile-auto-token-desktop {
                        0% {
                          left: 80px;
                          bottom: 30px;
                          transform: scale(0.4);
                          opacity: 0.1;
                        }
                        20% {
                          transform: scale(1.2);
                          opacity: 1;
                        }
                        100% {
                          left: calc(50% + 67.5px);
                          bottom: 200px;
                          transform: scale(0.3) translateX(-50%);
                          opacity: 0;
                        }
                      }

                      .animate-projectile-manual {
                        animation: projectile-manual 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                      }

                      .animate-projectile-auto-standard {
                        animation: projectile-auto-standard 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                      }

                      .animate-projectile-auto-token {
                        animation: projectile-auto-token-mobile 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                      }

                      @media (min-width: 1024px) {
                        .animate-projectile-auto-token {
                          animation: projectile-auto-token-desktop 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                        }
                      }
                    `}</style>

                    {/* Paramètres ultra-compacts intégrés en haut */}
                    <div className="flex flex-col gap-2 pb-2 border-b border-border/40">
                        <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                            Parameters
                        </span>
                        <ConfigPanel
                            config={config}
                            onConfigChange={(updates) => updateConfig(strategyId, updates)}
                        />
                    </div>

                    {/* Rendu de la frise chronologique active */}
                    <div className="w-full relative">
                        {strategyId === 'fixed-window' && (
                            <FixedWindowTimeline
                                events={events}
                                config={config as FixedWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; reset: number } | undefined}
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'sliding-window' && (
                            <SlidingWindowTimeline
                                events={events}
                                config={config as SlidingWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; windowStart: number; windowEnd: number } | undefined}
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'token-bucket' && (
                            <TokenBucketTimeline
                                events={events}
                                config={config as TokenBucketConfig}
                                lastResult={lastEvent?.result as { remaining: number; tokens: number; refillTime: number } | undefined}
                                startTime={startTime}
                            />
                        )}

                        {strategyId === 'individual-fixed-window' && (
                            <IndividualFixedWindowTimeline
                                events={events}
                                config={config as IndividualFixedWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; reset: number } | undefined}
                                startTime={startTime}
                            />
                        )}
                    </div>

                    {/* Particules de requêtes physiques */}
                    {projectiles.map((p) => {
                        const isToken = strategyId === 'token-bucket'
                        const baseLeftClass = isToken
                            ? 'lg:left-[calc(50%+67.5px)] left-1/2'
                            : 'left-1/2'
                        
                        const animationClass = p.type === 'manual'
                            ? 'animate-projectile-manual'
                            : isToken
                              ? 'animate-projectile-auto-token'
                              : 'animate-projectile-auto-standard'

                        return (
                            <div 
                                key={p.id}
                                className={`absolute w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_12px_rgba(59,130,246,0.85)] ${animationClass} pointer-events-none z-40 -translate-x-1/2 ${p.type === 'manual' ? baseLeftClass : ''}`}
                            />
                        )
                    })}

                    {/* Simulation Command Deck horizontal unifié au bas de la carte */}
                    <div className="mt-2 flex flex-col md:flex-row items-center justify-between gap-4 w-full relative z-30">
                        
                        {/* Zone Gauche : Capsule compacte Auto Requests + Interval Slider */}
                        <div className="flex justify-start w-full md:w-auto">
                            <div className="
                                flex items-center gap-4 px-4 py-2 rounded-full border border-border/70 
                                bg-card/85 shadow-2xs backdrop-blur-xs select-none w-full md:w-auto min-w-[280px]
                            ">
                                <div className="flex items-center gap-2.5">
                                    <Zap className={`size-3.5 transition-colors duration-300 ${autoRequests ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase whitespace-nowrap">Auto requests</span>
                                    <Switch checked={autoRequests} onCheckedChange={() => setAutoRequests(!autoRequests)} />
                                </div>
                                <div className="h-4 w-px bg-border/70" />
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground whitespace-nowrap w-8">{(autoInterval / 1000).toFixed(1)}s</span>
                                    <Slider
                                        value={[autoInterval]}
                                        onValueChange={(v) => {
                                            const val = Array.isArray(v) ? v[0] : v
                                            if (typeof val === 'number') {
                                                setAutoInterval(val)
                                            }
                                        }}
                                        min={300}
                                        max={3000}
                                        step={100}
                                        className="w-24 py-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Zone Centre : Send Request majestueux (parfaitement aligné avec le "Now" marker) */}
                        <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
                            <Button 
                                size="lg"
                                onClick={handleSendRequest}
                                className="
                                  relative overflow-hidden font-bold tracking-wide uppercase px-8 py-5 rounded-full
                                  bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-800 text-zinc-100 
                                  dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:border-none
                                  shadow-[0_4px_20px_rgba(59,130,246,0.18)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.32)]
                                  active:scale-[0.93] scale-100 hover:scale-[1.03] transition-all duration-200 gap-2 flex items-center cursor-pointer select-none
                                "
                            >
                                <Send className="size-4" />
                                <span>Send request</span>
                            </Button>
                        </div>

                        {/* Zone Droite : Bouton compact Reset Simulation & View Code */}
                        <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsCodeOpen(true)}
                                className="
                                  rounded-full border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold text-muted-foreground
                                  hover:bg-accent hover:text-foreground active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs gap-1.5 flex items-center
                                "
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                                <span>Code</span>
                            </Button>

                            <Button
                                size="icon"
                                onClick={handleReset}
                                className="
                                  rounded-full border border-border/70 bg-card/85 p-2.5 text-muted-foreground
                                  hover:bg-accent hover:text-foreground active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs
                                "
                                title="Reset Simulation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-4 hover:rotate-180 transition-transform duration-500"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Code Modal Dialog */}
            <Dialog open={isCodeOpen} onOpenChange={setIsCodeOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-4">
                    <DialogHeader className="pb-1 border-b border-border/40">
                        <DialogTitle className="text-base font-bold tracking-tight">API Implementation Example</DialogTitle>
                        <DialogDescription className="text-xs">
                            Below is the accurate initialization and integration snippet for this rate limiting strategy using the @ratelock/local engine.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <DynamicCodeExplorer strategyId={strategyId} config={config} isDark={isDark} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function StrategyTabs() {
    const activeStrategy = useAtomValue(activeStrategyAtom)
    const setActiveStrategy = useSetAtom(activeStrategyAtom)

    return (
        <Tabs
            value={activeStrategy}
            onValueChange={(value) => setActiveStrategy(value as StrategyId)}
            className="gap-5"
        >
            <TabsList className="
              h-auto rounded-2xl border border-border/70 bg-muted/55 p-1
            ">
                {STRATEGIES.map((id) => (
                    <TabsTrigger key={id} value={id} className="
                      rounded-xl px-4 py-2 text-sm
                    ">
                        {STRATEGY_LABELS[id]}
                    </TabsTrigger>
                ))}
            </TabsList>

            {STRATEGIES.map((id) => (
                <TabsContent key={id} value={id} className="space-y-5">
                    <div className="max-w-2xl">
                        <h3 className="
                          font-heading text-2xl font-semibold tracking-tight
                        ">
                            {STRATEGY_LABELS[id]}
                        </h3>
                        <p className="mt-2 text-sm/6 text-muted-foreground">
                            {STRATEGY_DESCRIPTIONS[id]}
                        </p>
                    </div>

                    <StrategyView strategyId={id} />
                </TabsContent>
            ))}
        </Tabs>
    )
}
