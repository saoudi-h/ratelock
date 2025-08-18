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
        <Card className="relative border-dashed shadow-none rounded-none bg-transparent">
            <DiagonalLinesBackground />
            <CardHeader className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div className="flex flex-col">
                    <CardTitle className="font-black font-serif text-3xl">{title}</CardTitle>
                    <CardDescription className="font-medium text-sm text-muted-foreground">
                        {subTitle}
                    </CardDescription>
                </div>
                {controls}
            </CardHeader>
            <div className="h-0 w-full border-b border-dashed border-border" />
            <CardContent className="z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="default"
                            onClick={sendManualRequest}
                            disabled={!isRunning}
                            className="relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg">
                            <span className="relative z-10">🚀 Send Request</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                        </Button>
                        {!isRunning ? (
                            <Button
                                variant="outline"
                                className=" border-green-500 hover:border-green-700"
                                onClick={startSimulation}>
                                Play
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                className=" bg-orange-500 hover:bg-orange-600"
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
                            className={` ${autoRequests ? '' : ''}`}
                            onClick={toggleAutoRequests}>
                            {autoRequests ? 'Disable Auto-Requests' : 'Auto-Requests'}
                        </Button>
                        {autoRequests && (
                            <div className="flex items-center gap-2 text-sm px-4">
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
                                <span className="text-muted-foreground min-w-[60px]">
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
