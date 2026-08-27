'use client'

import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
    const [hasHistory, setHasHistory] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            setHasHistory(true)
        }
    }, [])

    return (
        <main
            className="
              flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-12
              text-center
            ">
            <div
                className="relative w-full max-w-lg">
                <div className="relative">
                    <p className="text-9xl font-semibold text-primary">404</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
                    <p className="mx-auto mt-4 max-w-sm text-fd-muted-foreground">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <div
                        className="
                          mt-8 flex flex-col items-center gap-3
                          sm:flex-row sm:justify-center
                        ">
                            <Button
                                variant="solid"
                                render={<Link href="/" />}
                            >
                                Go Home 
                            </Button>
                        
                            <Button
                                variant="outline"
                                onClick={() => hasHistory ? window.history.back() : window.location.href = '/'}
                                className="">
                                Go Back
                            </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
