import { cn } from '@/lib/utils'
import { Refresh } from '@solar-icons/react-perf/BoldDuotone'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
        <Refresh
            role="status"
            aria-label="Loading"
            className={cn(`size-4 animate-spin`, className)}
            {...props}
        />
    )
}

export { Spinner }
