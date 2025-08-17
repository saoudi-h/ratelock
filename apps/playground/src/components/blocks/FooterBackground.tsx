import * as React from 'react'

export const FooterBackground = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1444 331"
        fill="none"
        width="100%"
        height="auto"
        {...props}>
        <g opacity={0.5}>
            <mask
                id="mask0_209_1448"
                x={0}
                y={0}
                maskUnits="userSpaceOnUse"
                style={{
                    maskType: 'alpha',
                }}>
                <path
                    fill="#D9D9D9"
                    fillRule="evenodd"
                    stroke="url(#paint0_radial_209_1448)"
                    d="M320 51.75C320 23.721 297.278 1 269.25 1H1v329h1442V1h-262.25C1152.72 1 1130 23.721 1130 51.75c0 28.028-22.72 50.75-50.75 50.75h-708.5c-28.028 0-50.75-22.722-50.75-50.75Z"
                    clipRule="evenodd"
                />
            </mask>
            <g filter="url(#filter0_n_209_1448)" mask="url(#mask0_209_1448)" opacity={0.9}>
                <circle cx={702} cy={-456} r={776} fill="url(#paint1_radial_209_1448)" />
            </g>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="url(#paint2_radial_209_1448)"
                d="M320 51.75C320 23.721 297.278 1 269.25 1H1v329h1442V1h-262.25C1152.72 1 1130 23.721 1130 51.75c0 28.028-22.72 50.75-50.75 50.75h-708.5c-28.028 0-50.75-22.722-50.75-50.75Z"
            />
        </g>
        <defs>
            <radialGradient
                id="paint0_radial_209_1448"
                cx={0}
                cy={0}
                r={1}
                gradientTransform="matrix(721 0 0 164.5 722 165.5)"
                gradientUnits="userSpaceOnUse">
                <stop offset={0.245} stopColor="#ccc" />
                <stop offset={1} stopColor="#ccc" />
            </radialGradient>
            <radialGradient
                id="paint1_radial_209_1448"
                cx={0}
                cy={0}
                r={1}
                gradientTransform="rotate(90 579 123) scale(776)"
                gradientUnits="userSpaceOnUse">
                <stop stopColor="#155DFC" />
                <stop offset={0.668} stopColor="#071A42" />
                <stop offset={1} stopColor="#155DFC" stopOpacity={0} />
            </radialGradient>
            <radialGradient
                id="paint2_radial_209_1448"
                cx={0}
                cy={0}
                r={1}
                gradientTransform="matrix(721 0 0 164.5 722 165.5)"
                gradientUnits="userSpaceOnUse">
                <stop stopColor="#155DFC" />
                <stop offset={0.214} stopColor="#0B1E48" />
                <stop offset={0.256} stopColor="#0E307C" />
                <stop offset={0.414} stopColor="#1A4299" />
                <stop offset={0.459} stopColor="#2153C0" />
                <stop offset={0.517} stopColor="#1D49AA" />
                <stop offset={0.613} stopColor="#0E2861" />
                <stop offset={0.668} stopColor="#071A42" />
                <stop offset={1} stopColor="#155DFC" stopOpacity={0} />
            </radialGradient>
            <filter
                id="filter0_n_209_1448"
                width={1552}
                height={1552}
                x={-74}
                y={-1232}
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse">
                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feTurbulence
                    baseFrequency="1.4285714626312256 1.4285714626312256"
                    numOctaves={3}
                    result="noise"
                    seed={9077}
                    stitchTiles="stitch"
                    type="fractalNoise"
                />
                <feComponentTransfer in="noise" result="coloredNoise1">
                    <feFuncR intercept={-0.5} slope={2} type="linear" />
                    <feFuncG intercept={-0.5} slope={2} type="linear" />
                    <feFuncB intercept={-0.5} slope={2} type="linear" />
                    <feFuncA
                        tableValues="0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"
                        type="discrete"
                    />
                </feComponentTransfer>
                <feComposite in="coloredNoise1" in2="shape" operator="in" result="noise1Clipped" />
                <feComponentTransfer in="noise1Clipped" result="color1">
                    <feFuncA tableValues="0 0.13" type="table" />
                </feComponentTransfer>
                <feMerge result="effect1_noise_209_1448">
                    <feMergeNode in="shape" />
                    <feMergeNode in="color1" />
                </feMerge>
            </filter>
        </defs>
    </svg>
)
