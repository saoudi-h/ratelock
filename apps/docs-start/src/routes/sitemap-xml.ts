import { createFileRoute } from '@tanstack/react-router'

import { blogSource, source } from '~/lib/source'
import { siteUrl } from '~/utils/site'

const WEEKLY = 'weekly'

type SitemapEntry = {
    url: string
    lastModified?: Date
    changeFrequency: string
    priority: number
}

/**
 * Prerendered to `/sitemap.xml`. Same entries as the Next app's `sitemap.ts`.
 */
export const Route = createFileRoute('/sitemap-xml')({
    server: {
        handlers: {
            GET: async () => {
                const url = (path: string) => new URL(path, siteUrl).toString()

                const docsPages = source.getPages()

                const entries: SitemapEntry[] = [
                    { url: url('/'), changeFrequency: WEEKLY, priority: 1 },
                    { url: url('/docs'), changeFrequency: WEEKLY, priority: 0.8 },
                    { url: url('/blog'), changeFrequency: WEEKLY, priority: 0.8 },
                    ...docsPages.map(page => {
                        const { lastModified } = page.data as unknown as {
                            lastModified?: Date | string
                        }
                        return {
                            url: url(page.url),
                            lastModified: lastModified ? new Date(lastModified) : undefined,
                            changeFrequency: WEEKLY,
                            priority: 0.5,
                        }
                    }),
                    ...blogSource.getPages().map(page => {
                        const d =
                            page.data.date instanceof Date
                                ? page.data.date
                                : new Date(page.data.date as string)
                        return {
                            url: url(page.url),
                            lastModified: d,
                            changeFrequency: WEEKLY,
                            priority: 0.6,
                        }
                    }),
                ]

                const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(entry => {
        const parts = [`    <loc>${entry.url}</loc>`]
        if (entry.lastModified) {
            parts.push(`    <lastmod>${entry.lastModified.toISOString().slice(0, 10)}</lastmod>`)
        }
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`)
        parts.push(`    <priority>${entry.priority}</priority>`)
        return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')}
</urlset>`

                return new Response(body, {
                    headers: {
                        'Content-Type': 'application/xml; charset=utf-8',
                    },
                })
            },
        },
    },
})
