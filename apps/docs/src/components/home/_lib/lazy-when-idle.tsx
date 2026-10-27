import { lazy, Suspense, type ComponentType } from 'react'

const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'wheel'] as const

let readyPromise: Promise<void> | undefined

/** A deferred section is released after this long without any interaction. */
const FALLBACK_DELAY_MS = 12_000

/**
 * Resolves at the first user interaction, or after a long quiet period,
 * whichever comes first. Nothing hydrates before that: the sections are far
 * below the fold, so the main thread stays free for the first viewport.
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
            setTimeout(() => {
                if ('requestIdleCallback' in window) window.requestIdleCallback(release)
                else release()
            }, FALLBACK_DELAY_MS)
        }
        if (document.readyState === 'complete') start()
        else window.addEventListener('load', start, { once: true })
    })
    return readyPromise
}

let queue: Promise<void> = Promise.resolve()

/**
 * Hands out one hydration slot at a time, a macrotask apart, so the sections
 * hydrate in page order instead of in one long task.
 */
function nextSlot(): Promise<void> {
    queue = queue.then(() => new Promise<void>(resolve => setTimeout(resolve, 60)))
    return queue
}

/**
 * Code-splits a below-the-fold section and delays its hydration.
 *
 * On the server the section renders normally, so the prerendered HTML keeps
 * its full content. In the browser the section's chunk (and the hydration of
 * its many GSAP effects) waits for the first interaction, which keeps the main
 * thread free while the first viewport becomes interactive. React keeps the
 * server HTML on screen while the boundary is suspended.
 */
export function lazyWhenIdle(load: () => Promise<ComponentType>): ComponentType {
    const Lazy = lazy(async () => {
        if (typeof window !== 'undefined') {
            await whenReady()
            await nextSlot()
        }
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
