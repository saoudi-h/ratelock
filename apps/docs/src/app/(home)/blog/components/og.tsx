import fs from 'node:fs/promises'
import path from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }

const FALLBACK_COVER = 'blog-fallback-og.png'
const HEADING_FONT = 'assets/og/FunnelDisplay-ExtraBold.ttf'

const LOGO_PATH =
    'M64.3047 12C64.2506 12 64.1964 12.0004 64.1423 12.0006L27.0001 12.0001C24.2386 12 22 14.2386 22 17.0001V113C22 114.657 23.3431 116 25 116H41.0859C42.4719 116 43.6763 115.056 44.0067 113.71C46.2517 104.566 51.8572 82.252 53.7922 74.3944C49.2146 71.9843 46.0928 67.1821 46.0928 61.6497C46.0928 53.6993 52.5385 47.2542 60.4897 47.2542C68.4409 47.2542 74.8866 53.6993 74.8866 61.6497C74.8866 67.2777 71.656 72.1501 66.9485 74.5172L78.0994 113.819C78.4656 115.109 79.644 116 80.9855 116H101.332C103.516 116 104.968 113.741 104.061 111.754L88.6959 78.1017C97.0652 71.2996 102.553 60.4967 102.553 49.0806C102.553 28.6016 85.4286 12 64.3047 12Z'

export async function loadHeadingFont() {
    return fs.readFile(path.join(process.cwd(), HEADING_FONT))
}

function toDataUri(buffer: Buffer, extension: string) {
    const type = extension === 'png' ? 'image/png' : 'image/jpeg'
    return `data:${type};base64,${buffer.toString('base64')}`
}

export async function loadCover(source?: string) {
    try {
        if (source && /^https?:\/\//i.test(source)) {
            const response = await fetch(source)
            if (!response.ok) throw new Error('fetch failed')
            const type = (response.headers.get('content-type') ?? '').split(';')[0] ?? ''
            if (!['image/png', 'image/jpeg'].includes(type)) {
                throw new Error('unsupported type')
            }
            const buffer = Buffer.from(await response.arrayBuffer())
            return `data:${type};base64,${buffer.toString('base64')}`
        }

        if (source?.startsWith('/')) {
            const extension = path.extname(source).slice(1).toLowerCase()
            if (!['png', 'jpg', 'jpeg'].includes(extension)) {
                throw new Error('unsupported extension')
            }
            const buffer = await fs.readFile(path.join(process.cwd(), 'public', source))
            return toDataUri(buffer, extension)
        }

        throw new Error('no cover')
    } catch {
        const buffer = await fs.readFile(path.join(process.cwd(), 'public', FALLBACK_COVER))
        return toDataUri(buffer, 'png')
    }
}

function clampText(value: string, max: number) {
    const text = value.trim()
    return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

export function OgTemplate({
    title,
    description,
    cover,
}: {
    title: string
    description?: string
    cover: string
}) {
    return (
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
            }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="44"
                    height="44"
                    viewBox="0 0 128 128">
                    <path d={LOGO_PATH} fill="#4ade80" />
                </svg>
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

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 48,
                }}>
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
                    {/* oxlint-disable-next-line nextjs/no-img-element -- satori ImageResponse requires <img> */}
                    <img src={cover} width={440} height={430} style={{ objectFit: 'cover' }} />
                </div>
            </div>
        </div>
    )
}
