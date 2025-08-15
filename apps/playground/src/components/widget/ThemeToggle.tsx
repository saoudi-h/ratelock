'use client'

import { useMounted } from '@/hooks/useMounted'
import { Moon, Sun } from '@solar-icons/react-perf/LineDuotone'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import React from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

const ICON_SIZE = {
    tiny: 14,
    small: 16,
    medium: 18,
    large: 20,
    xlarge: 24,
}

interface ThemeToggleProps {
    className?: string
    size?: keyof typeof ICON_SIZE
}

export const ThemeToggle = ({ className, size = 'small', ...props }: ThemeToggleProps) => {
    const { setTheme, resolvedTheme } = useTheme()
    const isMounted = useMounted()

    const iconSize = ICON_SIZE[size]

    const toggleTheme = React.useCallback(() => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
    }, [resolvedTheme, setTheme])

    const IconWrapper = ({ children }: { children: React.ReactNode }) => (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.2 } }}
            exit={{ x: 50, opacity: 0, transition: { duration: 0.3, ease: 'linear' } }}
            className={`
              absolute inset-0 flex size-full items-center justify-center
              focus:outline-hidden
            `}>
            {children}
        </motion.div>
    )

    if (isMounted) {
        return (
            <Button
                variant="ghost"
                size={'icon'}
                className={cn(
                    `
                      relative inline-flex cursor-pointer items-center
                      justify-center overflow-hidden rounded-md border
                      text-center
                      focus-visible:outline-3 focus-visible:outline-offset-2
                    `,
                    className
                )}
                onClick={toggleTheme}
                {...props}>
                <AnimatePresence initial={false}>
                    {resolvedTheme === 'dark' && (
                        <IconWrapper key="dark">
                            <Sun size={iconSize} />
                        </IconWrapper>
                    )}
                    {resolvedTheme === 'light' && (
                        <IconWrapper key="light">
                            <Moon size={iconSize} />
                        </IconWrapper>
                    )}
                </AnimatePresence>
            </Button>
        )
    }

    return (
        <Button
            size="icon"
            variant="ghost"
            className={cn(
                `
                  relative inline-flex cursor-pointer items-center
                  justify-center overflow-hidden rounded-md border text-center
                  focus-visible:outline-3 focus-visible:outline-offset-2
                `,
                className
            )}
            onClick={toggleTheme}
            {...props}>
            <div
                className={`
                  absolute inset-0 flex size-full items-center justify-center
                  focus:outline-hidden
                `}>
                <Moon
                    size={iconSize}
                    className={`
                  block
                  dark:hidden
                `}
                />
                <Sun
                    size={iconSize}
                    className={`
                  hidden
                  dark:block
                `}
                />
            </div>
        </Button>
    )
}
