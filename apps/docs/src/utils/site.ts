/**
 * Canonical origin of the site. Baked at build time. The site stays on
 * `ratelock-docs.vercel.app` until the project has its own domain.
 *
 * `import.meta.env` is a Vite feature; the optional chain keeps the module
 * importable from the build scripts, which run in plain Node and read the
 * production fallback.
 */
interface ViteEnv {
    VITE_SITE_URL?: string
}

const viteEnv = (import.meta as { env?: ViteEnv }).env

export const siteUrl = (viteEnv?.VITE_SITE_URL ?? 'https://ratelock-docs.vercel.app').replace(
    /\/+$/,
    ''
)

export const site = {
    name: 'RateLock',
    url: siteUrl,
    title: 'RateLock',
    description: 'Bulletproof rate limiting for modern applications',
    locale: 'en_US',
    githubUrl: 'https://github.com/saoudi-h/ratelock',
} as const

export function absoluteUrl(path = '/') {
    return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
