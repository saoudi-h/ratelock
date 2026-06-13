'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Send, Zap } from 'lucide-react'

interface SimulationControlsProps {
    autoRequests: boolean
    setAutoRequests: (val: boolean) => void
    autoInterval: number
    setAutoInterval: (val: number) => void
    onSendRequest: () => void
    onViewCode: () => void
    onReset: () => void
    isPlaying: boolean
    controlsRef?: React.RefObject<HTMLDivElement>
    autoToggleRef?: React.RefObject<HTMLDivElement | null>
    sendButtonRef?: React.RefObject<HTMLButtonElement | null>
}

export function SimulationControls({
    autoRequests,
    setAutoRequests,
    autoInterval,
    setAutoInterval,
    onSendRequest,
    onViewCode,
    onReset,
    isPlaying,
    controlsRef,
    autoToggleRef,
    sendButtonRef,
}: SimulationControlsProps) {
    return (
        <div
            ref={controlsRef}
            className="mt-2 flex flex-col md:flex-row items-center justify-between gap-4 w-full relative z-30">
            {/* Zone Left: Auto Requests control dial */}
            <div className="flex justify-start w-full md:w-auto">
                <div
                    ref={autoToggleRef}
                    className={`
                    flex items-center gap-4 px-4 py-2 rounded-2xl border border-border/70 
                    bg-card/85 shadow-sm backdrop-blur-sm select-none w-full md:w-auto min-w-[280px]
                    transition-opacity duration-200
                    ${!isPlaying ? 'opacity-50 pointer-events-none' : ''}
                `}>
                    <div className="flex items-center gap-2.5">
                        <Zap
                            className={`size-3.5 transition-colors duration-300 ${autoRequests ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-muted-foreground'}`}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase whitespace-nowrap">
                            Auto requests
                        </span>
                        <Switch
                            checked={autoRequests}
                            onCheckedChange={() => setAutoRequests(!autoRequests)}
                            disabled={!isPlaying}
                        />
                    </div>
                    <div className="h-4 w-px bg-border/70" />
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground whitespace-nowrap w-8">
                            {(autoInterval / 1000).toFixed(1)}s
                        </span>
                        <Slider
                            value={[autoInterval]}
                            onValueChange={v => {
                                const val = Array.isArray(v) ? v[0] : v
                                if (typeof val === 'number') {
                                    setAutoInterval(val)
                                }
                            }}
                            min={300}
                            max={3000}
                            step={100}
                            className="w-24 py-1"
                            disabled={!isPlaying}
                        />
                    </div>
                </div>
            </div>

            {/* Zone Center: Tactile Send Request button */}
            <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
                <Button
                    ref={sendButtonRef}
                    variant="solid"
                    size="xl"
                    onClick={onSendRequest}
                    disabled={!isPlaying}
                    className="font-bold tracking-wide uppercase shadow-sm hover:shadow-md cursor-pointer select-none"
                >
                    <Send className="size-4" />
                    <span>Send request</span>
                </Button>
            </div>

            {/* Zone Right: Reset Simulation & View Code buttons */}
            <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onViewCode}
                    className="rounded-xl text-muted-foreground hover:text-foreground shadow-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-3.5">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span>Code</span>
                </Button>

                <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={onReset}
                    className="rounded-xl text-muted-foreground hover:text-foreground shadow-sm"
                    title="Reset Simulation"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 hover:rotate-180 transition-transform duration-500">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                    </svg>
                </Button>
            </div>
        </div>
    )
}
