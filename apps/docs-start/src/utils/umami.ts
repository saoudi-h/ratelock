/**
 * Umami analytics.
 *
 * The Next app proxies the loader through `/p.js` and `/r.js` route handlers.
 * Here the scripts are copied from the Umami host at build time
 * (`scripts/sync-umami.ts`) and served from our own origin as static files,
 * which keeps the same first-party behaviour without a runtime proxy.
 *
 * The session replay (`r.js`) keeps the sampling and masking of the Next app
 * (15 % of the sessions, moderate masking).
 */
interface ViteEnv {
    VITE_UMAMI_ID?: string
    VITE_UMAMI_URL?: string
}

const viteEnv = (import.meta as { env?: ViteEnv }).env

export const umamiId = viteEnv?.VITE_UMAMI_ID ?? ''
export const umamiUrl = viteEnv?.VITE_UMAMI_URL ?? ''

export const umamiEnabled = Boolean(umamiId && umamiUrl)
