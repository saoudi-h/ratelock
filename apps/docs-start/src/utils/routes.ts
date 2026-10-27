export type TanStackLocation = {
    to: string
    params?: Record<string, string>
    search?: Record<string, string>
    hash?: string
}

/**
 * Maps a site path to the matching route of the app. The docs and the blog
 * are splat routes, so the path after the prefix becomes the splat
 * parameter.
 */
export function toTanStackLocation(href: string): TanStackLocation | null {
    const url = new URL(href, 'https://ratelock.invalid')
    if (url.origin !== 'https://ratelock.invalid') return null

    const search = Object.fromEntries(url.searchParams.entries())
    const hash = url.hash ? url.hash.slice(1) : undefined
    const path = url.pathname
    const extras = {
        ...(Object.keys(search).length > 0 ? { search } : {}),
        ...(hash ? { hash } : {}),
    }

    if (path === '/docs' || path.startsWith('/docs/')) {
        const splat = path.slice('/docs/'.length)
        return {
            to: '/docs/$',
            params: { _splat: decodeURIComponent(splat) },
            ...extras,
        }
    }

    if (path === '/blog' || path === '/blog/') {
        return { to: '/blog/', ...extras }
    }

    if (path.startsWith('/blog/')) {
        return {
            to: '/blog/$',
            params: { _splat: decodeURIComponent(path.slice('/blog/'.length)) },
            ...extras,
        }
    }

    return { to: path, ...extras }
}
