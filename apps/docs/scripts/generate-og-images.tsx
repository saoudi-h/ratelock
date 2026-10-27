/**
 * Renders the Open Graph images at build time.
 *
 * The deployment prerenders every page, so there is no server to draw them
 * on request. Every documentation page, the home page, the blog index and
 * every blog post get a PNG in `public/og`, at the address the `og:image`
 * tags point to.
 *
 * The layouts are the ones of the former Next app:
 * - docs/home: the dark template of `src/lib/og-template.tsx`, rendered by
 *   `next/og` with its default font (Geist Regular, bundled with Next 16).
 * - blog: the cover template of `src/app/(home)/blog/components/og.tsx`,
 *   rendered with the committed `FunnelDisplay-ExtraBold.ttf`.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'

import { siteUrl } from '../src/utils/site'
import { appRoot, collectDocsPaths } from './docs-paths'

const LOGO_PATH =
    'M64.3047 12C64.2506 12 64.1964 12.0004 64.1423 12.0006L27.0001 12.0001C24.2386 12 22 14.2386 22 17.0001V113C22 114.657 23.3431 116 25 116H41.0859C42.4719 116 43.6763 115.056 44.0067 113.71C46.2517 104.566 51.8572 82.252 53.7922 74.3944C49.2146 71.9843 46.0928 67.1821 46.0928 61.6497C46.0928 53.6993 52.5385 47.2542 60.4897 47.2542C68.4409 47.2542 74.8866 53.6993 74.8866 61.6497C74.8866 67.2777 71.656 72.1501 66.9485 74.5172L78.0994 113.819C78.4656 115.109 79.644 116 80.9855 116H101.332C103.516 116 104.968 113.741 104.061 111.754L88.6959 78.1017C97.0652 71.2996 102.553 60.4967 102.553 49.0806C102.553 28.6016 85.4286 12 64.3047 12Z'

const outputDir = path.join(appRoot, 'public', 'og')
const assetsDir = path.join(appRoot, 'assets', 'og')
const publicDir = path.join(appRoot, 'public')

/** Encodes an SVG string as a data URI image, the way Satori embeds rasters. */
function svgDataUri(svg: string) {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function toDataUri(buffer: Buffer, extension: string) {
    const type = extension === 'png' ? 'image/png' : 'image/jpeg'
    return `data:${type};base64,${buffer.toString('base64')}`
}

function clampText(value: string, max: number) {
    const text = value.trim()
    return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

/** Reads the title and the description out of the frontmatter of a page. */
async function readFrontmatter(url: string, root: string) {
    const candidates = [`${url}.mdx`, path.join(url, 'index.mdx')]
    for (const candidate of candidates) {
        let source: string
        try {
            source = await readFile(path.join(appRoot, root, candidate), 'utf8')
        } catch {
            continue
        }
        const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
        const field = (key: string) => {
            const value = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
            return value?.replace(/^(['"])(.*)\1$/, '$2')
        }
        return {
            title: field('title') ?? url,
            description: field('description'),
            image: field('image'),
        }
    }
    throw new Error(`No page found for ${url}`)
}

/** The scattered lock pattern on the right side of the docs template. */
const lockPattern =
    svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="630" viewBox="0 0 500 630">
  <g opacity="0.06" fill="white">
    <path transform="translate(60, 40) scale(0.7)" d="${LOGO_PATH}"/>
    <path transform="translate(200, 120) scale(0.5)" d="${LOGO_PATH}"/>
    <path transform="translate(340, 60) scale(0.6)" d="${LOGO_PATH}"/>
    <path transform="translate(120, 220) scale(0.4)" d="${LOGO_PATH}"/>
    <path transform="translate(280, 280) scale(0.55)" d="${LOGO_PATH}"/>
    <path transform="translate(420, 200) scale(0.45)" d="${LOGO_PATH}"/>
    <path transform="translate(50, 380) scale(0.5)" d="${LOGO_PATH}"/>
    <path transform="translate(220, 400) scale(0.65)" d="${LOGO_PATH}"/>
    <path transform="translate(380, 360) scale(0.4)" d="${LOGO_PATH}"/>
    <path transform="translate(140, 500) scale(0.55)" d="${LOGO_PATH}"/>
    <path transform="translate(320, 520) scale(0.5)" d="${LOGO_PATH}"/>
    <path transform="translate(450, 460) scale(0.6)" d="${LOGO_PATH}"/>
  </g>
</svg>`)

const logoSvg = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 128 128">
  <path fill="#4ade80" d="${LOGO_PATH}"/>
</svg>`
)

const [geist, funnelDisplay] = await Promise.all([
    readFile(path.join(assetsDir, 'Geist-Regular.ttf')),
    readFile(path.join(assetsDir, 'FunnelDisplay-ExtraBold.ttf')),
])

const docsFonts = [{ name: 'Geist', data: geist, weight: 400 as const, style: 'normal' as const }]
const blogFonts = [
    { name: 'Funnel', data: funnelDisplay, weight: 800 as const, style: 'normal' as const },
]

async function writePng(file: string, svg: string) {
    const png = new Resvg(svg).render().asPng()
    const target = path.join(outputDir, file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, png)
}

/** The dark docs/home template of the Next app (`src/lib/og-template.tsx`). */
async function renderDocsOg(
    file: string,
    { title, description }: { title: string; description?: string }
) {
    const svg = await satori(
        <div
            style={{
                position: 'relative',
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: '#0c0c0c',
                overflow: 'hidden',
                // Satori sizes boxes like content-box by default; without
                // this the padded root overflows the canvas and clips its
                // last child.
                boxSizing: 'border-box',
            }}>
            {/* Warm radial glow (right side) */}
            <div
                style={{
                    position: 'absolute',
                    display: 'flex',
                    top: '-100px',
                    right: '-200px',
                    width: '800px',
                    height: '800px',
                    backgroundImage:
                        'radial-gradient(circle at center, rgba(249,115,22,0.12) 0%, rgba(234,88,12,0.04) 50%, rgba(234,88,12,0) 100%)',
                }}
            />

            {/* Lock pattern on right side */}
            <img
                src={lockPattern}
                width={500}
                height={630}
                style={{
                    position: 'absolute',
                    right: '0px',
                    top: '0px',
                    display: 'flex',
                }}
            />

            {/* Content */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '100%',
                    padding: '64px',
                    boxSizing: 'border-box',
                }}>
                {/* Top: Logo + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={logoSvg} width={40} height={40} style={{ display: 'flex' }} />
                    <span
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.01em',
                        }}>
                        RateLock
                    </span>
                </div>

                {/* Middle: Big Title + Subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '-40px' }}>
                    <span
                        style={{
                            fontSize: '82px',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.0,
                            color: '#ffffff',
                        }}>
                        {title}
                    </span>
                    {description && (
                        <span
                            style={{
                                fontSize: '30px',
                                color: '#a1a1aa',
                                lineHeight: 1.4,
                                marginTop: '24px',
                                maxWidth: '680px',
                            }}>
                            {description}
                        </span>
                    )}
                </div>

                {/* Bottom: Domain */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '24px', color: '#a1a1aa' }}>{siteUrl}</span>
                </div>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: docsFonts,
        }
    )
    await writePng(file, svg)
}

async function loadCover(source?: string) {
    try {
        if (source && /^https?:\/\//i.test(source)) {
            const response = await fetch(source)
            if (!response.ok) throw new Error('fetch failed')
            const type = (response.headers.get('content-type') ?? '').split(';')[0] ?? ''
            if (!['image/png', 'image/jpeg'].includes(type)) {
                throw new Error('unsupported type')
            }
            const buffer = Buffer.from(await response.arrayBuffer())
            return toDataUri(buffer, type.split('/')[1] ?? 'png')
        }

        if (source?.startsWith('/')) {
            const extension = path.extname(source).slice(1).toLowerCase()
            if (!['png', 'jpg', 'jpeg'].includes(extension)) {
                throw new Error('unsupported extension')
            }
            const buffer = await readFile(path.join(publicDir, source))
            return toDataUri(buffer, extension)
        }

        throw new Error('no cover')
    } catch {
        const buffer = await readFile(path.join(publicDir, 'blog-fallback-og.png'))
        return toDataUri(buffer, 'png')
    }
}

/** The cover template of the Next blog (`(home)/blog/components/og.tsx`). */
async function renderBlogOg(
    file: string,
    { title, description, cover }: { title: string; description?: string; cover: string }
) {
    const svg = await satori(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 48,
                backgroundColor: '#0c0c0c',
                padding: 56,
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={logoSvg} width={44} height={44} style={{ display: 'flex' }} />
                <div
                    style={{
                        fontSize: 27,
                        fontWeight: 800,
                        color: '#ffffff',
                        fontFamily: 'Funnel',
                    }}>
                    RateLock
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: 600,
                        gap: 22,
                    }}>
                    <div
                        style={{
                            fontSize: 54,
                            fontWeight: 800,
                            lineHeight: 1.12,
                            color: '#ffffff',
                            fontFamily: 'Funnel',
                        }}>
                        {clampText(title, 84)}
                    </div>
                    {description ? (
                        <div
                            style={{
                                fontSize: 25,
                                lineHeight: 1.45,
                                color: '#a1a1aa',
                            }}>
                            {clampText(description, 130)}
                        </div>
                    ) : null}
                </div>
                <div
                    style={{
                        display: 'flex',
                        width: 440,
                        height: 430,
                        borderRadius: 28,
                        overflow: 'hidden',
                        border: '2px solid #27272a',
                        backgroundColor: '#18181b',
                    }}>
                    {/* oxlint-disable-next-line unicorn/prefer-native-coercion-functions -- Satori accepts data URIs for local raster assets. */}
                    <img src={cover} width={440} height={430} style={{ objectFit: 'cover' }} />
                </div>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: blogFonts,
        }
    )
    await writePng(file, svg)
}

const pages = collectDocsPaths()

await renderDocsOg('home/image.png', {
    title: 'RateLock',
    description: 'Bulletproof rate limiting for modern applications',
})
for (const pageUrl of pages) {
    const frontmatter = await readFrontmatter(pageUrl, path.join('content', 'docs'))
    await renderDocsOg(`${pageUrl}/image.png`, frontmatter)
}

const blogFallbackCover = await loadCover()
await renderBlogOg('blog/image.png', {
    title: 'Blog',
    description:
        'Articles on rate limiting. Integrations, strategies, and resilience notes from the RateLock project.',
    cover: blogFallbackCover,
})

const blogRoot = path.join(appRoot, 'content', 'blog')
const blogFiles = (await readdir(blogRoot)).filter(name => name.endsWith('.mdx'))
for (const file of blogFiles) {
    const slug = file.slice(0, -'.mdx'.length)
    const frontmatter = await readFrontmatter(slug, path.join('content', 'blog'))
    const cover = await loadCover(frontmatter.image)
    await renderBlogOg(`blog/${slug}/image.png`, {
        title: frontmatter.title,
        description: frontmatter.description,
        cover,
    })
}

console.log(`Rendered ${pages.length + blogFiles.length + 2} Open Graph images.`)
