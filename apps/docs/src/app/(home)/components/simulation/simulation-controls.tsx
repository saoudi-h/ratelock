'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Bolt, Plain2 } from '@solar-icons/react-perf/BoldDuotone'

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
            className="
              relative z-30 mt-2 flex w-full flex-col items-center
              justify-between gap-4
              md:flex-row
            ">
            {/* Zone Left: Auto Requests control dial */}
            <div className="
              flex w-full justify-start
              md:w-auto
            ">
                <div
                    ref={autoToggleRef}
                    className={`
                      flex w-full min-w-[280px] items-center gap-4 rounded-2xl
                      border border-border/70 bg-card/85 px-4 py-2 shadow-sm
                      backdrop-blur-sm transition-opacity duration-200
                      select-none
                      md:w-auto
                      ${!isPlaying ? 'pointer-events-none opacity-50' : ''}
                    `}>
                    <div className="flex items-center gap-2.5">
                        <Bolt
                            className={`
                              size-3.5 transition-colors duration-300
                              ${autoRequests ? `
                                animate-pulse fill-amber-500 text-amber-500
                              ` : `text-muted-foreground`}
                            `}
                        />
                        <span className="
                          text-[10px] font-bold tracking-wide whitespace-nowrap
                          text-muted-foreground uppercase
                        ">
                            Auto requests
                        </span>
                        <Switch
                            checked={autoRequests}
                            onCheckedChange={() => setAutoRequests(!autoRequests)}
                            disabled={!isPlaying}
                        />
                    </div>
                    <div className="h-4 w-px bg-border/70" />
                    <div className="flex flex-1 items-center gap-2">
                        <span className="
                          w-8 font-mono text-[10px] font-bold whitespace-nowrap
                          text-muted-foreground
                        ">
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
            <div className="
              flex justify-center
              md:absolute md:left-1/2 md:-translate-x-1/2
            ">
                <Button
                    ref={sendButtonRef}
                    variant="solid"
                    size="xl"
                    onClick={onSendRequest}
                    disabled={!isPlaying}
                    className="
                      cursor-pointer font-bold tracking-wide uppercase shadow-sm
                      select-none
                      hover:shadow-md
                    "
                >
                    <Plain2 className="size-4" />
                    <span>Send request</span>
                </Button>
            </div>

            {/* Zone Right: Reset Simulation & View Code buttons */}
            <div className="
              flex w-full items-center justify-end gap-2
              md:w-auto
            ">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onViewCode}
                    className="
                      rounded-xl text-muted-foreground shadow-sm
                      hover:text-foreground
                    "
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
                    className="
                      rounded-xl text-muted-foreground shadow-sm
                      hover:text-foreground
                    "
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
                        className="
                          size-4 transition-transform duration-500
                          hover:rotate-180
                        ">
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
