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
import { Controls, ConfigPanel } from './controls'
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
  refillRate: ${config.refillRate}, // par seconde
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

// La fenêtre dynamique (rolling-start) commence au premier appel de l'utilisateur !
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
                theme: 'github-dark',
            })
            setHtml(result)
        })
        return () => {
            cancelled = true
        }
    }, [code])

    return (
        <Card className="rounded-2xl border border-border/70 bg-[#0d1117] overflow-hidden shadow-xs h-full">
            <CardHeader className="border-b border-[#21262d] py-3.5 bg-[#161b22]/50 px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-500/80" />
                        <span className="size-2.5 rounded-full bg-amber-500/80" />
                        <span className="size-2.5 rounded-full bg-emerald-500/80" />
                        <span className="text-[11px] font-semibold text-[#8b949e] ml-2 font-mono select-none">
                            api.ts
                        </span>
                    </div>
                    <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-[#8b949e] bg-[#21262d]/60 border border-[#30363d] px-2 py-0.5 rounded-md select-none font-mono">
                        TypeScript
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0 select-text overflow-auto text-[12.5px] bg-[#0d1117]">
                <div 
                    className="p-5 font-mono leading-relaxed [&>pre]:bg-transparent! [&>pre]:m-0! [&>pre]:p-0! [&_code]:font-mono! text-left"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </CardContent>
        </Card>
    )
}

function MetricsStrip({
    remaining,
    allowed,
    denied,
    eventsCount,
}: {
    remaining: number
    allowed: number
    denied: number
    eventsCount: number
}) {
    return (
        <div className="
          grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 overflow-hidden 
          rounded-2xl border border-border/70 shadow-xs bg-muted/5
          backdrop-blur-xs
        ">
            <div className="bg-card/45 px-5 py-4 flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                    Remaining
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {remaining}
                </span>
            </div>
            <div className="bg-card/45 px-5 py-4 flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                    Allowed
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-emerald-500 dark:text-emerald-400">
                    {allowed}
                </span>
            </div>
            <div className="bg-card/45 px-5 py-4 flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                    Denied
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-rose-500 dark:text-rose-400">
                    {denied}
                </span>
            </div>
            <div className="bg-card/45 px-5 py-4 flex flex-col justify-center space-y-1">
                <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase">
                    Events
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground/80">
                    {eventsCount}
                </span>
            </div>
        </div>
    )
}

function StrategyView({ strategyId }: { strategyId: StrategyId }) {
    const {
        events,
        autoRequests,
        setAutoRequests,
        autoInterval,
        setAutoInterval,
        sendRequest,
        config,
    } = useSimulation(strategyId)

    const resetSimulation = useSetAtom(resetSimulationAtom)
    const updateConfig = useSetAtom(updateConfigAtom)

    const [isDark, setIsDark] = useState(false)
    const [shootingLasers, setShootingLasers] = useState<{ id: string }[]>([])

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

    const handleSendRequest = async () => {
        const id = `laser-${Date.now()}`
        setShootingLasers((prev) => [...prev, { id }])
        
        // Attendre 150ms pour simuler le temps de trajet du laser vers la frise
        setTimeout(async () => {
            await sendRequest()
        }, 150)

        setTimeout(() => {
            setShootingLasers((prev) => prev.filter((l) => l.id !== id))
        }, 400)
    }

    const handleReset = async () => {
        await resetSimulation(strategyId)
    }

    const lastEvent = events[events.length - 1]
    const remaining =
        lastEvent?.remaining ??
        (isTokenBucketConfig(config)
            ? (config as TokenBucketConfig).capacity
            : (config as FixedWindowConfig).limit)
    const allowedCount = events.filter((event) => event.allowed).length
    const deniedCount = events.length - allowedCount

    return (
        <div className="
          grid gap-6
          lg:grid-cols-[300px_minmax(0,1fr)]
        ">
            {/* Colonne Gauche : Configuration & Paramètres */}
            <div className="flex flex-col gap-6">
                <Card
                    size="sm"
                    className="
                      gap-0 rounded-2xl border border-border/70 bg-card/85 py-0
                      shadow-none ring-0 backdrop-blur-md
                    "
                >
                    <CardHeader className="border-b border-border/70 py-5">
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>
                            Configurez la stratégie et le générateur.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 py-5">
                        <Controls
                            onReset={handleReset}
                            autoInterval={autoInterval}
                            onAutoIntervalChange={setAutoInterval}
                        />

                        <ConfigPanel
                            config={config}
                            onConfigChange={(updates) => updateConfig(strategyId, updates)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Colonne Droite : Visualisation, Métriques et Code Shiki */}
            <div className="space-y-6">
                <MetricsStrip 
                    remaining={remaining}
                    allowed={allowedCount}
                    denied={deniedCount}
                    eventsCount={events.length}
                />

                <Card
                    size="sm"
                    className="
                      gap-0 rounded-2xl border border-border/70 bg-card/70 py-0
                      shadow-none ring-0
                    "
                >
                    <CardHeader className="border-b border-border/70 py-4">
                        <CardTitle>Visualization</CardTitle>
                        <CardDescription>
                            Frise chronologique défilante à 60fps accélérée par GPU.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-5 relative flex flex-col items-center">
                        <style>{`
                          @keyframes laser-shoot {
                            0% {
                              bottom: 48px;
                              height: 0px;
                              opacity: 0.95;
                              filter: brightness(1.5) drop-shadow(0 0 4px #3b82f6);
                            }
                            35% {
                              height: 50px;
                              opacity: 1;
                            }
                            100% {
                              bottom: 255px;
                              height: 0px;
                              opacity: 0;
                            }
                          }
                          .animate-laser-shoot {
                            animation: laser-shoot 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                          }
                        `}</style>

                        {/* Rendu de la frise chronologique active */}
                        <div className="w-full">
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

                        {/* Particules laser de requêtes */}
                        {shootingLasers.map((l) => {
                            const laserLeftClass = strategyId === 'token-bucket'
                                ? 'lg:left-[calc(50%+67.5px)] left-1/2'
                                : 'left-1/2'
                            return (
                                <div 
                                    key={l.id}
                                    className={`absolute w-[3px] bg-gradient-to-t from-primary/45 to-primary rounded-full shadow-[0_0_10px_#3b82f6] animate-laser-shoot pointer-events-none z-40 -translate-x-1/2 ${laserLeftClass}`}
                                />
                            )
                        })}

                        {/* Simulation Command Deck: Auto Requests toggle & Send Request button */}
                        <div className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full relative z-30 transition-all duration-300 ${
                            strategyId === 'token-bucket' 
                                ? 'lg:translate-x-[67.5px] translate-x-0' 
                                : 'translate-x-0'
                        }`}>
                            {/* Auto requests toggle - absolutely positioned to the left on desktop so the button remains centered */}
                            <div className="
                                flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border/70 
                                bg-card/85 shadow-2xs backdrop-blur-xs select-none
                                sm:absolute sm:left-6 lg:left-8 xl:left-12
                            ">
                                <Zap className="size-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Auto requests</span>
                                <Switch checked={autoRequests} onCheckedChange={() => setAutoRequests(!autoRequests)} />
                            </div>

                            {/* Send Request Button - Centered */}
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
                                <Send className="size-4 animate-pulse" />
                                <span>Send request</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Explorateur de Code Interactif Shiki */}
                <DynamicCodeExplorer strategyId={strategyId} config={config} isDark={isDark} />
            </div>
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
