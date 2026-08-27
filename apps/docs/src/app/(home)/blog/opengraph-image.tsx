import { ImageResponse } from 'next/og'

import { loadCover, loadHeadingFont, OG_SIZE, OgTemplate } from './components/og'

export const alt = 'RateLock blog'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpengraphImage() {
    const [cover, font] = await Promise.all([loadCover(), loadHeadingFont()])

    return new ImageResponse(
        <OgTemplate
            title="Blog"
            description="Articles on rate limiting. Integrations, strategies, and resilience notes from the RateLock project."
            cover={cover}
        />,
        {
            ...size,
            fonts: [{ name: 'Funnel', data: font, weight: 800, style: 'normal' }],
        }
    )
}
