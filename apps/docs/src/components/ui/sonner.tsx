'use client'

import {
    CheckCircle,
    DangerTriangle,
    Forbidden,
    InfoCircle,
    Refresh,
} from '@solar-icons/react-perf/BoldDuotone'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            icons={{
                success: <CheckCircle className="size-4" />,
                info: <InfoCircle className="size-4" />,
                warning: <DangerTriangle className="size-4" />,
                error: <Forbidden className="size-4" />,
                loading: <Refresh className="size-4 animate-spin" />,
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'cn-toast',
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
