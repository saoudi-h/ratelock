import { useEffect, useState } from 'react'

export function useRefreshInterval(isRunning: boolean, interval: number = 50) {
    const [, setTick] = useState(0)

    useEffect(() => {
        if (!isRunning) return

        const intervalId = setInterval(() => {
            setTick(tick => tick + 1)
        }, interval)

        return () => clearInterval(intervalId)
    }, [isRunning, interval])

    return isRunning
}
