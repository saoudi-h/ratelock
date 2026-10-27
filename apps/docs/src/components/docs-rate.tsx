'use client'

import { Rate } from '~/components/ui-blocks/rate'
import { onRateAction } from '~/lib/github'

/**
 * The guide feedback widget.
 *
 * The Next app called a server action; here the widget calls the
 * `onRateAction` server function, which runs as a serverless function on
 * Vercel and writes the same GitHub discussions. The wrapper adapts the
 * `(url, feedback)` signature the shared component expects.
 */
export function DocsRate() {
    return (
        <Rate
            onRateAction={async (url, feedback) => {
                return onRateAction({
                    data: { url, opinion: feedback.opinion, message: feedback.message },
                })
            }}
        />
    )
}
