import type { Metadata } from 'next/types'

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

export const baseUrl =
    process.env.VERCEL_ENV === 'production' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
    !process.env.VERCEL_URL
        ? siteUrl
        : new URL(`https://${process.env.VERCEL_URL}`)


export function createMetadata(override: Metadata): Metadata {
    return {
        ...override,
        openGraph: {
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            url: baseUrl.href,
            images: '/og/home/image.png',
            siteName: 'RateLock',
            ...override.openGraph,
        },
        twitter: {
            card: 'summary_large_image',
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            images: '/og/home/image.png',
            ...override.twitter,
        },
    }
}
