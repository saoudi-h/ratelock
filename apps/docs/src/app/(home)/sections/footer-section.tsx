'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'

export function FooterSection() {
    return (
        <footer className="relative border-t border-border/50 bg-muted">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                    <div>
                        <h3 className="font-heading text-lg font-semibold">
                            Ratelock
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Rate limiting, crafted with care.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <Link
                            href="/docs"
                            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Icon icon="lucide:book-open" className="size-4" />
                            Documentation
                        </Link>
                        <a
                            href="https://github.com/saoudi-h/ratelock"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Icon icon="mdi:github" className="size-4" />
                            GitHub
                        </a>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
                    <p>MIT License, free forever</p>
                    <p>Built with care by the RateLock team</p>
                </div>
            </div>
        </footer>
    )
}
