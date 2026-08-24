'use client'

import { CheckCircleIcon, DangerTriangleIcon, ForbiddenIcon, InfoCircleIcon, RefreshIcon } from '@solar-icons/react/bold-duotone'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            icons={{
                success: <CheckCircleIcon className="size-4" />,
                info: <InfoCircleIcon className="size-4" />,
                warning: <DangerTriangleIcon className="size-4" />,
                error: <ForbiddenIcon className="size-4" />,
                loading: <RefreshIcon className="size-4 animate-spin" />,
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
