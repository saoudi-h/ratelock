'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap } from '../_lib/gsap'

/**
 * Tiny wrapper around `useGSAP` that auto-creates the scope ref and
 * makes sure plugins are registered. Returns the scope ref to spread
 * onto the root element, plus the `contextSafe` helper.
 *
 * Use this when a section needs its own GSAP context. For one-off
 * scroll reveals you can prefer `useScrollReveal` instead.
 */
export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
    setup: (ctx: {
        scope: React.RefObject<T | null>
        contextSafe: <F extends (...args: never[]) => unknown>(fn: F) => F
    }) => void,
    deps: unknown[] = []
) {
    registerGsap()
    const scope = useRef<T | null>(null)

    useGSAP(
        (_context, contextSafe) => {
            if (!scope.current || !contextSafe) return
            setup({ scope, contextSafe })
        },
        { scope, dependencies: deps }
    )

    return { scope, gsap }
}
