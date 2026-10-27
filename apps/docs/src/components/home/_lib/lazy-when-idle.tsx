import { lazy, Suspense, type ComponentType } from 'react'

const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'wheel'] as const

let readyPromise: Promise<void> | undefined

/**
 * Resolves once the browser is idle, or at the first user interaction,
 * whichever comes first. Shared by every deferred section so they are all
 * released together instead of each scheduling its own timer.
 */
function whenReady(): Promise<void> {
    readyPromise ??= new Promise(resolve => {
        let done = false
        const release = () => {
            if (done) return
            done = true
            for (const event of INTERACTION_EVENTS) window.removeEventListener(event, release)
            resolve()
        }
        for (const event of INTERACTION_EVENTS) {
            window.addEventListener(event, release, { passive: true, once: true })
        }
        const start = () => {
            if ('requestIdleCallback' in window)
                window.requestIdleCallback(release, { timeout: 2500 })
            else setTimeout(release, 1500)
        }
        if (document.readyState === 'complete') start()
        else window.addEventListener('load', start, { once: true })
    })
    return readyPromise
}

/**
 * Code-splits a below-the-fold section and delays its hydration.
 *
 * On the server the section renders normally, so the prerendered HTML keeps
 * its full content. In the browser the section's chunk (and the hydration of
 * its many GSAP effects) waits for the page to be idle, which keeps the main
 * thread free while the first viewport becomes interactive. React keeps the
 * server HTML on screen while the boundary is suspended.
 */
export function lazyWhenIdle(load: () => Promise<ComponentType>): ComponentType {
    const Lazy = lazy(async () => {
        if (typeof window !== 'undefined') await whenReady()
        // The icons of the deferred sections ship with them, not with the first load.
        await import('~/generated/icons-deferred')
        return { default: await load() }
    })

    return function Deferred() {
        return (
            <Suspense fallback={null}>
                <Lazy />
            </Suspense>
        )
    }
}
