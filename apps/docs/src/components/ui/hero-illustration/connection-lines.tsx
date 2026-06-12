import React from "react";
import { LAYOUT } from "./layout-config";

/**
 * 3D Connection Lines fanning out in mid-air.
 * Positioned dynamically using coordinates from LAYOUT.
 * Rotated using `rotateZ(90deg) rotateX(90deg)` to align local SVG (x, y) coordinates
 * directly to global (Y, Z) axes in 3D.
 */
export function ConnectionLines() {
  const { glassPane, rateCards } = LAYOUT;

  // 1. Calculate GlassPane connection point (start point at the end of the chart)
  const yStart = glassPane.top + glassPane.height; // 220
  const zStart = Math.round(
    glassPane.elevation +
      (glassPane.chartHeight * (140 - glassPane.chartEnd.y)) / 140
  ); // ~108

  // 2. Calculate RateCards Y-coordinate and container height
  const containerHeight =
    4 * rateCards.cardHeight + 3 * rateCards.gap; // 204
  const yEnd = rateCards.top + containerHeight; // 104

  // Generate paths dynamically for the 4 cards
  const paths = Array.from({ length: 4 }, (_, i) => {
    // Calculate vertical Z center for the checkmark on card i (0: Login, 3: Upload)
    const zEnd =
      rateCards.elevation +
      containerHeight -
      (i * (rateCards.cardHeight + rateCards.gap) + rateCards.cardHeight / 2);

    // Dynamic S-curve (cubic Bezier) spanning from yStart to yEnd
    const controlY1 = yStart - 30;
    const controlY2 = yEnd + 30;

    const d = `M ${yStart} ${zStart} C ${controlY1} ${zStart}, ${controlY2} ${zEnd}, ${yEnd} ${zEnd}`;

    return { d };
  });

  // Checkmark X position: rateCards.left + padding_left + checkmark_radius = 180 + 14 + 10 = 204
  const checkmarkX = rateCards.left + 24;

  return (
    <div
      style={{
        position: "absolute",
        left: checkmarkX,
        top: 0,
        width: 320,
        height: 320,
        transformOrigin: "top left",
        transform: "rotateZ(90deg) rotateX(90deg)",
        transformStyle: "preserve-3d",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 320 320"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <defs>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {paths.map((path, idx) => (
          <React.Fragment key={`connection-path-${idx}`}>
            {/* Base Neon Glow Layer (Thick, Blurry, Soft) */}
            <path
              d={path.d}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3.5"
              strokeOpacity="0.15"
              filter="url(#lineGlow)"
            />

            {/* Sharp Core Layer (Thin, Bright, Dotted) */}
            <path
              d={path.d}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.2"
              strokeOpacity="0.8"
              strokeDasharray="4, 5"
            />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}

export default ConnectionLines;
