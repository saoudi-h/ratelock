import type { MetadataRoute } from 'next'

import { baseUrl } from '@/lib/metadata'
import { blogSource, source } from '@/lib/source'

export const revalidate = false

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const url = (path: string) => new URL(path, baseUrl).toString()

    const docsPages = source.getPages()
    const blogPages = blogSource
        .getPages()
        .filter(
            p =>
                (p.data.status as string | undefined) !== 'draft' ||
                process.env.NODE_ENV !== 'production'
        )

    return [
        {
            url: url('/'),
            changeFrequency: 'weekly' as const,
            priority: 1,
        },
        {
            url: url('/docs'),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: url('/blog'),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        ...docsPages.map(page => ({
            url: url(page.url),
            lastModified: page.data.lastModified
                ? new Date(page.data.lastModified as Date)
                : undefined,
            changeFrequency: 'weekly' as const,
            priority: 0.5 as const,
        })),
        ...blogPages.map(page => {
            const d =
                page.data.date instanceof Date ? page.data.date : new Date(page.data.date as string)
            return {
                url: url(page.url),
                lastModified: d,
                changeFrequency: 'weekly' as const,
                priority: 0.6 as const,
            }
        }),
    ]
}
