'use client'

import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import { Collapsible, CollapsibleContent } from 'fumadocs-ui/components/ui/collapsible'
import { Dislike, Like } from '@solar-icons/react-perf/BoldDuotone'
import { usePathname } from 'next/navigation'
import { type SyntheticEvent, useEffect, useState, useTransition } from 'react'

const rateButtonVariants = cva(
    `
      inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm
      font-medium
      disabled:cursor-not-allowed
      [&_svg]:size-4
    `,
    {
        variants: {
            active: {
                true: `
                  bg-fd-accent text-fd-accent-foreground
                  [&_svg]:fill-current
                `,
                false: 'text-fd-muted-foreground',
            },
        },
    }
)

export interface Feedback {
    opinion: 'good' | 'bad'
    url?: string
    message: string
}

export interface ActionResponse {
    githubUrl: string
}

export function Rate({
    onRateAction,
}: {
    onRateAction: (url: string, feedback: Feedback) => Promise<ActionResponse>
}) {
    const url = usePathname()
    const [previous, setPrevious] = useState<Result | null>(null)
    const [opinion, setOpinion] = useState<'good' | 'bad' | null>(null)
    const [message, setMessage] = useState('')
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const item = localStorage.getItem(`ratelock-feedback-${url}`)
        if (item === null) return
        setTimeout(() => {
            setPrevious(JSON.parse(item) as Result)
        }, 0)
    }, [url])

    useEffect(() => {
        const key = `ratelock-feedback-${url}`
        if (previous) localStorage.setItem(key, JSON.stringify(previous))
        else localStorage.removeItem(key)
    }, [previous, url])

    function submit(e?: SyntheticEvent) {
        if (opinion == null) return

        startTransition(async () => {
            const feedback: Feedback = { opinion, message }
            void onRateAction(url, feedback).then(response => {
                setPrevious({ response, ...feedback })
                setMessage('')
                setOpinion(null)
            })
        })

        e?.preventDefault()
    }

    const activeOpinion = previous?.opinion ?? opinion

    return (
        <Collapsible
            open={opinion !== null || previous !== null}
            onOpenChange={v => {
                if (!v) setOpinion(null)
            }}
            className="border-y py-3">
            <div className="flex flex-row items-center gap-2">
                <p className="pe-2 text-sm font-medium">How is this guide?</p>
                <button
                    disabled={previous !== null}
                    className={cn(rateButtonVariants({ active: activeOpinion === 'good' }))}
                    onClick={() => setOpinion('good')}>
                    <Like />
                    Good
                </button>
                <button
                    disabled={previous !== null}
                    className={cn(rateButtonVariants({ active: activeOpinion === 'bad' }))}
                    onClick={() => setOpinion('bad')}>
                    <Dislike />
                    Bad
                </button>
            </div>
            <CollapsibleContent className="mt-3">
                {previous ? (
                    <div className="
                      flex flex-col items-center gap-3 rounded-xl bg-fd-card
                      px-3 py-6 text-center text-sm text-fd-muted-foreground
                    ">
                        <p>Thank you for your feedback!</p>
                        <div className="flex flex-row items-center gap-2">
                            <a
                                href={previous.response?.githubUrl}
                                rel="noreferrer noopener"
                                target="_blank"
                                className="
                                  inline-flex items-center justify-center
                                  rounded-md bg-fd-primary px-3 py-1.5 text-xs
                                  font-medium text-fd-primary-foreground
                                  shadow-sm transition-colors
                                  hover:bg-fd-primary/90
                                ">
                                View on GitHub
                            </a>
                            <button
                                className="
                                  inline-flex items-center justify-center
                                  rounded-md border bg-fd-secondary px-3 py-1.5
                                  text-xs font-medium transition-colors
                                  hover:bg-fd-muted
                                "
                                onClick={() => {
                                    setOpinion(previous.opinion)
                                    setPrevious(null)
                                }}>
                                Submit Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="flex flex-col gap-3" onSubmit={submit}>
                        <textarea
                            autoFocus
                            required
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="
                              resize-none rounded-lg border bg-fd-secondary p-3
                              text-fd-secondary-foreground
                              placeholder:text-fd-muted-foreground
                              focus-visible:outline-none
                            "
                            placeholder="Leave your feedback..."
                            onKeyDown={e => {
                                if (!e.shiftKey && e.key === 'Enter') submit(e)
                            }}
                        />
                        <button
                            type="submit"
                            className="
                              inline-flex w-fit items-center justify-center
                              rounded-md border bg-fd-background px-3 py-1.5
                              text-sm font-medium transition-colors
                              hover:bg-fd-muted
                              disabled:opacity-50
                            "
                            disabled={isPending}>
                            Submit
                        </button>
                    </form>
                )}
            </CollapsibleContent>
        </Collapsible>
    )
}

interface Result extends Feedback {
    response?: ActionResponse
}
