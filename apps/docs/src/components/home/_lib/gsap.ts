'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let registered = false

export function registerGsap() {
    if (registered || typeof window === 'undefined') return
    gsap.registerPlugin(ScrollTrigger, SplitText)
    gsap.config({ nullTargetWarn: false })
    ScrollTrigger.config({ limitCallbacks: true })
    gsap.ticker.lagSmoothing(500, 33)
    registered = true
}

export { gsap, ScrollTrigger, SplitText }
