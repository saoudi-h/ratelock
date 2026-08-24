import { RefreshIcon } from '@solar-icons/react/bold-duotone'

import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
        <RefreshIcon
            role="status"
            aria-label="Loading"
            className={cn(`size-4 animate-spin`, className)}
            {...props}
        />
    )
}

export { Spinner }
