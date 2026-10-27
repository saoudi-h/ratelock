import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

/**
 * Prerendered to `/404.html`. The root `notFoundComponent` renders the same
 * UI for client-side misses.
 */
export const Route = createFileRoute('/404')({
    head: () =>
        seo({
            title: 'Page not found',
            description: 'The page you are looking for does not exist or has been moved.',
            path: '/404',
            noIndex: true,
        }),
    component: NotFoundPage,
})

function NotFoundPage() {
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
                </div>
            </div>
        </main>
    )
}
