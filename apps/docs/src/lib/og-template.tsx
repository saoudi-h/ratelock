import { env } from '@env'
import { ImageResponse } from 'next/og'

const LOGO_PATH =
    'M64.3047 12C64.2506 12 64.1964 12.0004 64.1423 12.0006L27.0001 12.0001C24.2386 12 22 14.2386 22 17.0001V113C22 114.657 23.3431 116 25 116H41.0859C42.4719 116 43.6763 115.056 44.0067 113.71C46.2517 104.566 51.8572 82.252 53.7922 74.3944C49.2146 71.9843 46.0928 67.1821 46.0928 61.6497C46.0928 53.6993 52.5385 47.2542 60.4897 47.2542C68.4409 47.2542 74.8866 53.6993 74.8866 61.6497C74.8866 67.2777 71.656 72.1501 66.9485 74.5172L78.0994 113.819C78.4656 115.109 79.644 116 80.9855 116H101.332C103.516 116 104.968 113.741 104.061 111.754L88.6959 78.1017C97.0652 71.2996 102.553 60.4967 102.553 49.0806C102.553 28.6016 85.4286 12 64.3047 12Z'

interface OGImageProps {
    title: string
    description?: string
    badge?: string
}

export function generateOGImage({ title, description, badge: _badge }: OGImageProps) {
    return new ImageResponse(
        <div
            style={{
                position: 'relative',
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: '#0c0c0c',
                overflow: 'hidden',
            }}>
            {/* ── Warm radial glow (right side) ── */}
            <svg
                width="800"
                height="800"
                style={{
                    position: 'absolute',
                    top: '-100px',
                    right: '-200px',
                    pointerEvents: 'none',
                }}>
                <defs>
                    <radialGradient id="glow-warm" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
                        <stop offset="50%" stopColor="#ea580c" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect width="800" height="800" fill="url(#glow-warm)" />
            </svg>

            {/* ── Lock pattern on right side ── */}
            <svg
                width="500"
                height="630"
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    pointerEvents: 'none',
                }}>
                {/* Scattered lock icons at various sizes and opacities */}
                <g opacity="0.06">
                    <path d={LOGO_PATH} fill="white" transform="translate(60, 40) scale(0.7)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(200, 120) scale(0.5)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(340, 60) scale(0.6)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(120, 220) scale(0.4)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(280, 280) scale(0.55)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(420, 200) scale(0.45)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(50, 380) scale(0.5)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(220, 400) scale(0.65)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(380, 360) scale(0.4)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(140, 500) scale(0.55)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(320, 520) scale(0.5)" />
                    <path d={LOGO_PATH} fill="white" transform="translate(450, 460) scale(0.6)" />
                </g>
            </svg>

            {/* ── Content ── */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '100%',
                    padding: '64px',
                }}>
                {/* Top: Logo + Name */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                    }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 128 128">
                        <path d={LOGO_PATH} fill="#4ade80" />
                    </svg>
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
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: '-40px',
                    }}>
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
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                    <span
                        style={{
                            fontSize: '24px',
                            fontFamily: 'monospace',
                            color: '#a1a1aa',
                        }}>
                        {env.NEXT_PUBLIC_SITE_URL}
                    </span>
                </div>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
        }
    )
}
