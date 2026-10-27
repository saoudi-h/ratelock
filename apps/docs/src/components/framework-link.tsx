import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

import { toTanStackLocation } from '~/utils/routes'

/**
 * Link of the Fumadocs layouts. It receives an `href` and maps it to the
 * matching route of the app: the docs and the blog are splat routes, so the
 * path after the prefix becomes the splat parameter.
 */
export function FrameworkLink({
    href,
    prefetch,
    ...props
}: { href?: string; prefetch?: boolean } & Omit<ComponentProps<'a'>, 'href'>) {
    if (href?.startsWith('#')) return <a href={href} {...props} />

    const preload = prefetch === false ? false : 'intent'
    const location = toTanStackLocation(href ?? '/')
    if (!location) return <a href={href} {...props} />

    return (
        <Link
            to={location.to as never}
            params={location.params as never}
            search={location.search as never}
            hash={location.hash}
            preload={preload}
            {...props}
        />
    )
}

type ResolvableSource = {
    resolveHref: (href: string, parent: never) => string
}

/**
 * Client-safe replacement for `createRelativeLink` of `fumadocs-ui/mdx`.
 * The browser export of that helper is a stub that throws, so using it in a
 * route component breaks hydration. `resolveHref` runs anywhere.
 */
export function createRelativeLink<Page>(source: ResolvableSource, page: Page) {
    return function RelativeLink({
        href,
        ...props
    }: { href?: string } & Omit<ComponentProps<'a'>, 'href'>) {
        return (
            <FrameworkLink
                href={href ? source.resolveHref(href, page as never) : href}
                {...props}
            />
        )
    }
}
