'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let registered = false

export function registerGsap() {
    if (registered || typeof window === 'undefined') return
    gsap.registerPlugin(ScrollTrigger, SplitText)
    gsap.config({ nullTargetWarn: false })
    gsap.ticker.lagSmoothing(0)
    registered = true
}

export { gsap, ScrollTrigger, SplitText }
