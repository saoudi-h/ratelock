'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
    const [hasHistory, setHasHistory] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasHistory(true)
        }
    }, [])

    return (
        <main className="
          flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center
          px-6 py-12 text-center
        ">
            <div className="
              relative w-full max-w-lg overflow-hidden rounded-2xl border
              bg-fd-card/50 p-12
            ">
                <div className="
                  absolute inset-0 bg-linear-to-b from-fd-primary/5
                  to-transparent
                " />
                <div className="relative">
                    <p className="text-sm font-medium text-fd-muted-foreground">404</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
                    <p className="
                      mx-auto mt-4 max-w-sm text-fd-muted-foreground
                    ">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <div className="
                      mt-8 flex flex-col items-center gap-3
                      sm:flex-row sm:justify-center
                    ">
                        <Link
                            href="/"
                            className="
                              inline-flex items-center justify-center rounded-md
                              bg-fd-primary px-4 py-2 text-sm font-medium
                              text-fd-primary-foreground shadow-sm
                              transition-colors
                              hover:bg-fd-primary/90
                            ">
                            Go Home
                        </Link>
                        {hasHistory && (
                            <button
                                onClick={() => window.history.back()}
                                className="
                                  inline-flex items-center justify-center
                                  rounded-md border bg-fd-background px-4 py-2
                                  text-sm font-medium transition-colors
                                  hover:bg-fd-muted
                                ">
                                Go Back
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
