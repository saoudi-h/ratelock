import { allSizes, optimizedImageSources } from './image-optimization'

/**
 * Maps a `next/image` request to the file `scripts/optimize-images.ts`
 * wrote into `public/optimized/`. Returns `null` when the source has no
 * precomputed variant, so the caller can fall back to the original.
 */
export function optimizedImageUrl(src: string, width: number): string | null {
    const source = optimizedImageSources.find(item => item.src === src)
    if (!source || !allSizes.includes(width)) return null

    const key = source.file.slice(source.file.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '')
    return `/optimized/${key}/${width}.webp`
}
