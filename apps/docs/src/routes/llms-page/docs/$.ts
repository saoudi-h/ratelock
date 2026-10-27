import { createFileRoute, notFound } from '@tanstack/react-router'

import { source } from '~/lib/source'

/**
 * Prerendered to `/docs/<path>.mdx`, one file per page. The prerender
 * configuration in `vite.config.ts` lists every page with its output path.
 * The Next app exposed the same content through the `/docs/:path*.mdx`
 * rewrite to the `llms.mdx` route.
 */
export const Route = createFileRoute('/llms-page/docs/$')({
    server: {
        handlers: {
            GET: async ({ params }) => {
                const slugs = params._splat?.split('/').filter(Boolean) ?? []
                const page = source.getPage(slugs)
                if (!page) throw notFound()

                const text = await (
                    page.data as unknown as { getText: (mode: string) => Promise<string> }
                ).getText('processed')

                return new Response(text, {
                    headers: {
                        'Content-Type': 'text/markdown; charset=utf-8',
                    },
                })
            },
        },
    },
})
