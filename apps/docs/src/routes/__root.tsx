import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { RootProvider } from 'fumadocs-ui/provider/tanstack'
import { Provider as JotaiProvider } from 'jotai'
import { ReactLenis, type LenisRef } from 'lenis/react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { FrameworkLink } from '~/components/framework-link'
import { gsap, registerGsap, ScrollTrigger } from '~/components/home/_lib/gsap'
import { Button } from '~/components/ui/button'
import { Toaster } from '~/components/ui/sonner'
import { TooltipProvider } from '~/components/ui/tooltip'
import { site } from '~/utils/site'
import { umamiEnabled, umamiId, umamiUrl } from '~/utils/umami'

import appCss from '~/styles/app.css?url'

function replayLoader({ id, url }: { id: string; url: string }) {
    const attrs = JSON.stringify({
        src: '/r.js',
        'data-website-id': id,
        'data-host-url': url,
        'data-sample-rate': '0.15',
        'data-mask-level': 'moderate',
        'data-max-duration': '300000',
    })
    return `(function(){var a=${attrs};function l(){var s=document.createElement('script');for(var k in a)s.setAttribute(k,a[k]);document.body.appendChild(s)}function i(){(window.requestIdleCallback||function(f){setTimeout(f,2000)})(l)}document.readyState==='complete'?i():addEventListener('load',i)})()`
}

export const Route = createRootRoute({
    head: () => {
        return {
            meta: [
                { charSet: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { title: site.title },
                { name: 'description', content: site.description },
            ],
            links: [
                { rel: 'stylesheet', href: appCss },
                // The latin subsets are fetched with the page, so the text is
                // not laid out again when the fonts replace the fallbacks.
                ...[
                    'funnel-display-latin',
                    'funnel-sans-latin',
                    'ubuntu-mono-latin-400',
                    'ubuntu-mono-latin-700',
                ].map(font => ({
                    rel: 'preload',
                    href: `/fonts/${font}.woff2`,
                    as: 'font',
                    type: 'font/woff2',
                    crossOrigin: 'anonymous' as const,
                })),
                { rel: 'icon', href: '/favicon.ico' },
                { rel: 'icon', href: '/icon0.svg', type: 'image/svg+xml' },
                { rel: 'icon', href: '/icon1.png', sizes: '96x96', type: 'image/png' },
                { rel: 'apple-touch-icon', href: '/apple-icon.png', sizes: '180x180' },
                { rel: 'manifest', href: '/manifest.json' },
                // Same first-party loading as the Next app: the analytics
                // scripts are served from our own origin.
                ...(umamiEnabled ? [{ rel: 'preload', href: '/p.js', as: 'script' as const }] : []),
            ],
        }
    },
    shellComponent: RootDocument,
    notFoundComponent: NotFound,
})

/**
 * Bridges Lenis with GSAP's ticker so that ScrollTrigger reads positions
 * from the smoothed scroll instead of native scroll events. Pattern from
 * Darkroom Engineering's official Lenis docs.
 */
function LenisGsapBridge() {
    const lenisRef = useRef<LenisRef>(null)

    useEffect(() => {
        registerGsap()

        function update(time: number) {
            lenisRef.current?.lenis?.raf(time * 1000)
        }

        gsap.ticker.add(update)
        gsap.ticker.lagSmoothing(0)

        const lenis = lenisRef.current?.lenis
        lenis?.on('scroll', ScrollTrigger.update)

        return () => {
            gsap.ticker.remove(update)
            lenis?.off('scroll', ScrollTrigger.update)
        }
    }, [])

    return (
        <ReactLenis
            root
            ref={lenisRef}
            options={{
                allowNestedScroll: true,
                autoRaf: false,
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 1.4,
                syncTouch: false,
            }}
        />
    )
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="flex min-h-screen flex-col">
                <JotaiProvider>
                    <RootProvider components={{ Link: FrameworkLink }}>
                        <TooltipProvider>
                            <LenisGsapBridge />
                            {children}
                            <Toaster />
                        </TooltipProvider>
                    </RootProvider>
                </JotaiProvider>
                {umamiEnabled ? (
                    <>
                        <script
                            defer
                            src="/p.js"
                            data-website-id={umamiId}
                            data-host-url={umamiUrl}
                            data-performance="true"
                        />
                        {/* The session replay recorder is 45 KiB and not needed for the
                            first render: it loads once the page is idle. */}
                        <script
                            dangerouslySetInnerHTML={{
                                __html: replayLoader({ id: umamiId, url: umamiUrl }),
                            }}
                        />
                    </>
                ) : null}
                <Scripts />
            </body>
        </html>
    )
}

function NotFound() {
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
            <div className="relative w-full max-w-lg">
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
                        <Button variant="solid" render={<FrameworkLink href="/" />}>
                            Go Home
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                hasHistory ? window.history.back() : (window.location.href = '/')
                            }>
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
