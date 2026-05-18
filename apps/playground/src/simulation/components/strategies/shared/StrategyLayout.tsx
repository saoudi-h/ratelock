import { DiagonalLinesBackground } from '@/components/blocks/DiagonalLinesBackground'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import React from 'react'

interface Props {
    children: React.ReactNode
    title: string
    subTitle: string
    description: string
    controls: React.ReactNode
    autoRequests: boolean
    autoRequestInterval: number
    sendManualRequest: () => void
    toggleAutoRequests: () => void
    setAutoRequestInterval: (interval: number) => void
    isRunning: boolean
    startSimulation: () => void
    stopSimulation: () => void
    resetSimulation: () => void
}

export const StrategyLayout = ({
    children,
    controls,
    title,
    subTitle,
    description,
    autoRequests,
    autoRequestInterval,
    sendManualRequest,
    toggleAutoRequests,
    setAutoRequestInterval,
    isRunning,
    startSimulation,
    stopSimulation,
    resetSimulation,
}: Props) => {
    return (
        <Card
            className="
              relative rounded-none border-dashed bg-transparent shadow-none
            ">
            <DiagonalLinesBackground />
            <CardHeader
                className="
                  relative flex flex-col items-center justify-between gap-4
                  md:flex-row md:items-start
                ">
                <div className="flex flex-col">
                    <CardTitle className="font-serif text-3xl font-black">{title}</CardTitle>
                    <CardDescription
                        className="
                      text-sm font-medium text-muted-foreground
                    ">
                        {subTitle}
                    </CardDescription>
                </div>
                {controls}
            </CardHeader>
            <div className="h-0 w-full border-b border-dashed border-border" />
            <CardContent className="z-10">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="default"
                            onClick={sendManualRequest}
                            disabled={!isRunning}
                            className="
                              relative overflow-hidden bg-blue-600 font-semibold
                              text-white transition-all duration-200
                              hover:scale-105 hover:bg-blue-700 hover:shadow-lg
                              active:scale-95
                            ">
                            <span className="relative z-10">🚀 Send Request</span>
                            <div
                                className="
                                  absolute inset-0 -translate-x-full
                                  bg-linear-to-r from-transparent via-white/10
                                  to-transparent transition-transform
                                  duration-700
                                  hover:translate-x-full
                                "
                            />
                        </Button>
                        {!isRunning ? (
                            <Button
                                variant="outline"
                                className="
                                  border-green-500
                                  hover:border-green-700
                                "
                                onClick={startSimulation}>
                                Play
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                className="
                                  bg-orange-500
                                  hover:bg-orange-600
                                "
                                onClick={stopSimulation}>
                                Pause
                            </Button>
                        )}
                        <Button variant="outline" className="" onClick={resetSimulation}>
                            Reset
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 bg-background">
                        <Button
                            variant={autoRequests ? 'destructive' : 'outline'}
                            className={`
                              ${autoRequests ? '' : ''}
                            `}
                            onClick={toggleAutoRequests}>
                            {autoRequests ? 'Disable Auto-Requests' : 'Auto-Requests'}
                        </Button>
                        {autoRequests && (
                            <div
                                className="
                              flex items-center gap-2 px-4 text-sm
                            ">
                                <Label htmlFor="fixed-interval-slider">Interval:</Label>
                                <Slider
                                    id="fixed-interval-slider"
                                    className="w-20"
                                    classNames={{
                                        track: 'bg-background',
                                    }}
                                    defaultValue={[50]}
                                    step={100}
                                    min={200}
                                    max={5000}
                                    value={[autoRequestInterval]}
                                    onValueChange={value =>
                                        setAutoRequestInterval(value[0] || 200 * 50)
                                    }
                                />
                                <span
                                    className="
                                      min-w-[60px] text-muted-foreground
                                    ">
                                    {autoRequestInterval < 1000
                                        ? `${autoRequestInterval}ms`
                                        : `${(autoRequestInterval / 1000).toFixed(1)}s`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {children}
            </CardContent>
            <CardFooter className="z-10 mt-3 text-sm text-muted-foreground">
                {description}
            </CardFooter>
        </Card>
    )
}
