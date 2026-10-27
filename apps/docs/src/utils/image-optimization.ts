/**
 * Static replacement for the `next/image` optimizer.
 *
 * The Next app serves the blog covers through `/_next/image`, which resizes
 * and re-encodes them at request time. This build cannot run that endpoint,
 * so the same optimization is applied during the build and the result is
 * served as a plain file. The width candidates and the encoder settings
 * mirror Next's defaults, so both apps send the browser the same bytes and
 * render the same pixels.
 */

/** Next's default `deviceSizes`. */
export const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840].sort((a, b) => a - b)

/** Next's default `imageSizes`. */
export const imageSizes = [32, 48, 64, 96, 128, 256, 384]

/** Next's default `allSizes`. */
export const allSizes = [...deviceSizes, ...imageSizes].sort((a, b) => a - b)

/** Next's default image quality. */
export const defaultQuality = 75

export type ImageWidths = {
    widths: number[]
    kind: 'w' | 'x'
}

/**
 * Mirrors Next's `getWidths`: a `sizes` prop selects the width candidates,
 * a numeric `width` produces a 1x/2x pair, and everything else falls back
 * to the device widths.
 */
export function getWidths(width: number | undefined, sizes: string | undefined): ImageWidths {
    if (sizes) {
        const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g
        const percentSizes: number[] = []
        let match: RegExpExecArray | null
        while ((match = viewportWidthRe.exec(sizes))) {
            percentSizes.push(Number.parseInt(match[2] as string, 10))
        }
        if (percentSizes.length > 0) {
            const smallestRatio = Math.min(...percentSizes) * 0.01
            const smallest = (deviceSizes[0] as number) * smallestRatio
            return {
                widths: allSizes.filter(size => size >= smallest),
                kind: 'w',
            }
        }
        return { widths: allSizes, kind: 'w' }
    }

    if (typeof width !== 'number') {
        return { widths: deviceSizes, kind: 'w' }
    }

    const widths = [
        ...new Set(
            [width, width * 2].map(
                candidate =>
                    allSizes.find(size => size >= candidate) ?? allSizes[allSizes.length - 1]!
            )
        ),
    ]
    return { widths, kind: 'x' }
}

export type OptimizedImageSource = {
    /** The `src` value the shared components pass to `next/image`. */
    src: string
    /** The file in `public/` that holds the original bytes. */
    file: string
}

/**
 * The images the components load through `next/image`. Every entry is
 * optimized during the build.
 */
export const optimizedImageSources: OptimizedImageSource[] = [
    { src: '/blog-fallback-thumbnail.png', file: '/blog-fallback-thumbnail.png' },
]
