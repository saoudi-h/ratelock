import { createFileRoute } from '@tanstack/react-router'

import { blogSource } from '~/lib/source'
import { siteUrl } from '~/utils/site'

function escapeXml(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

/**
 * Prerendered to `/blog/rss.xml`. Same output as the Next app's
 * `blog/rss.xml/route.ts`.
 */
export const Route = createFileRoute('/blog-rss-xml')({
    server: {
        handlers: {
            GET: async () => {
                const pages = [...blogSource.getPages()].sort((a, b) => {
                    const da =
                        a.data.date instanceof Date
                            ? a.data.date.getTime()
                            : new Date(a.data.date as string).getTime()
                    const db =
                        b.data.date instanceof Date
                            ? b.data.date.getTime()
                            : new Date(b.data.date as string).getTime()
                    return db - da
                })

                const site = siteUrl.replace(/\/$/, '')

                const items = pages
                    .map(page => {
                        const date =
                            page.data.date instanceof Date
                                ? page.data.date
                                : new Date(page.data.date as string)
                        const url = `${site}${page.url}`
                        return `    <item>
      <title>${escapeXml(page.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <description>${escapeXml(page.data.description ?? '')}</description>
      <pubDate>${date.toUTCString()}</pubDate>
      <author>${escapeXml(page.data.author as string)}</author>
    </item>`
                    })
                    .join('\n')

                const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RateLock Blog</title>
    <link>${escapeXml(`${site}/blog`)}</link>
    <description>Guides, comparisons, and resilience patterns for production rate limiting.</description>
    <language>en</language>
${items}
  </channel>
</rss>`

                return new Response(xml, {
                    headers: {
                        'Content-Type': 'application/rss+xml; charset=utf-8',
                    },
                })
            },
        },
    },
})
