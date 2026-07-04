/**
 * Custom easing curves used across the home page.
 * One project, one motion signature — these are reused everywhere
 * instead of GSAP's stock "power2.out" / "expo.out" defaults so the
 * page has a coherent rhythm.
 */

/** Snappy enter — strong tail-end deceleration, ideal for entrances */
export const easeOutSnap = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Soft exit — gentle pull-away */
export const easeInSoft = 'cubic-bezier(0.4, 0, 0.7, 0)'

/** Drawer / lateral movement (Ionic-inspired) */
export const easeDrawer = 'cubic-bezier(0.32, 0.72, 0, 1)'

/** Punchy in-out for movement / morph */
export const easeInOutPower = 'cubic-bezier(0.77, 0, 0.175, 1)'

/**
 * GSAP-style ease names (string form). GSAP accepts the keywords
 * directly so we expose them here. The shape mirrors
 * https://gsap.com/docs/v3/Eases/.
 */
export const GsapEase = {
    /** Entrances: starts fast then settles. Mirrors easeOutSnap. */
    outSnap: 'expo.out',
    /** Slow start, snappy finish */
    inOutPower: 'power3.inOut',
    /** Soft, low-amplitude bounce. */
    backOutSoft: 'back.out(1.2)',
    /** Linear — for scrubbed scroll progress only */
    none: 'none',
} as const
