import { createFileRoute } from '@tanstack/react-router'

import { getLLMText } from '~/lib/get-llm-text'
import { source } from '~/lib/source'

/**
 * Prerendered to `/llms-full.txt`. The full content of every documentation
 * page, formatted for LLM consumption.
 */
export const Route = createFileRoute('/llms-full-txt')({
    server: {
        handlers: {
            GET: async () => {
                const scanned = await Promise.all(source.getPages().map(getLLMText))

                return new Response(scanned.join('\n\n'), {
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                    },
                })
            },
        },
    },
})
