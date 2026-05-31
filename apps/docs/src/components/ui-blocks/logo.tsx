import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { SVGProps } from 'react'
import React from 'react'

export const LogoIcon: React.FC<SVGProps<SVGSVGElement>> = props => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 128 128"
            {...props}>
            <path
                fill="currentColor"
                d="M64.305 12H27a5 5 0 0 0-5 5v96a3 3 0 0 0 3 3h16.086c1.386 0 2.59-.944 2.92-2.29 2.246-9.144 7.851-31.458 9.786-39.316-4.577-2.41-7.7-7.212-7.7-12.744 0-7.95 6.447-14.396 14.398-14.396S74.887 53.7 74.887 61.65c0 5.628-3.231 10.5-7.939 12.867L78.1 113.82A3 3 0 0 0 80.985 116h20.347c2.184 0 3.636-2.259 2.729-4.246L88.696 78.102c8.37-6.802 13.857-17.605 13.857-29.021C102.553 28.6 85.429 12 64.305 12"></path>
        </svg>
    )
}

export const Logo: React.FC<{ iconClassName?: string; className?: string }> = ({
    className,
    iconClassName,
}) => {
    return (
        <div
            className={cn(
                `
              flex cursor-pointer items-center justify-center gap-4 p-2
            `,
                className
            )}>
            <LogoIcon className={cn('size-7', iconClassName)} />
            <h3 className={`font-heading text-lg font-bold tracking-tight`}>Ratelock</h3>
        </div>
    )
}

export const LogoLink: React.FC<{ href?: string }> = ({ href = '/' }) => {
    return (
        <Link href={href} className="cursor-pointer">
            <Logo />
        </Link>
    )
}
