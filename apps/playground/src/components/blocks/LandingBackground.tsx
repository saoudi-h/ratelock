import * as React from "react"
export const LandingBackground = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={772}
    height={366}
    fill="none"
    {...props}
  >
    <g filter="url(#a)" opacity={0.3}>
      <circle cx={386} cy={-20} r={386} fill="url(#b)" />
    </g>
    <defs>
      <radialGradient
        id="b"
        cx={0}
        cy={0}
        r={1}
        gradientTransform="matrix(0 386 -386 0 386 -20)"
        gradientUnits="userSpaceOnUse"
      >
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
        id="a"
        width={772}
        height={772}
        x={0}
        y={-406}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
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
        <feComposite
          in="coloredNoise1"
          in2="shape"
          operator="in"
          result="noise1Clipped"
        />
        <feComponentTransfer in="noise1Clipped" result="color1">
          <feFuncA tableValues="0 0.13" type="table" />
        </feComponentTransfer>
        <feMerge result="effect1_noise_206_1445">
          <feMergeNode in="shape" />
          <feMergeNode in="color1" />
        </feMerge>
      </filter>
    </defs>
  </svg>
)