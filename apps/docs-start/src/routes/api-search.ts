import { createFileRoute } from '@tanstack/react-router'
import { createFromSource } from 'fumadocs-core/search/server'

import { source } from '~/lib/source'

/**
 * Prerendered to `/api/search`. The Orama index is exported at build time and
 * read by the browser, so the search never calls a server.
 *
 * The Next app had no `/api/search` route, so the search dialog of the
 * production docs site failed with a 404. This build fixes that by shipping
 * a static index.
 */
export const Route = createFileRoute('/api-search')({
    server: {
        handlers: {
            GET: async () => {
                const search = createFromSource(source, {
                    // https://docs.orama.com/open-source/supported-languages
                    language: 'english',
                })

                const index = await search.export()

                return new Response(JSON.stringify(index), {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                })
            },
        },
    },
})
