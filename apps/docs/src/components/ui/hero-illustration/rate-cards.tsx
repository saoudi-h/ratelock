import React from "react";
import { LAYOUT } from "./layout-config";

const CARDS = [
  { title: "Login", value: "10 req/s" },
  { title: "Checkout", value: "30 req/s" },
  { title: "Search", value: "60 req/s" },
  { title: "Upload", value: "20 req/s" },
] as const;

/**
 * Four floating rate-limit cards standing on the right side of the base plate.
 * Floats vertically via `translateZ(45px) rotateX(-90deg)`.
 * Extrudes 6 layers backward to create volumetric depth blocks.
 */
export function RateCards() {
  const { left, top, width, cardHeight, gap, elevation } = LAYOUT.rateCards;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transformOrigin: "bottom center",
        transform: `translateZ(${elevation}px) rotateX(-90deg)`,
        display: "flex",
        flexDirection: "column",
        gap,
        transformStyle: "preserve-3d",
      }}
    >
      {CARDS.map((card) => (
        <div
          key={card.title}
          style={{
            position: "relative",
            width,
            height: cardHeight,
            transformStyle: "preserve-3d",
          }}
        >
          {/* ── Extruded Back Face Layers (receding backward) ── */}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`card-depth-${i}`}
              style={{
                position: "absolute",
                inset: 0,
                background: "oklch(from var(--card) calc(l - 0.08) c h)",
                border: "1px solid oklch(from var(--border) calc(l - 0.08) c h / 0.2)",
                borderRadius: 10,
                transform: `translateZ(${-(i + 1) * 0.8}px)`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* ── Front Card Face ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "oklch(from var(--card) l c h / 0.88)",
              border: "1px solid oklch(from var(--border) l c h / 0.3)",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transform: "translateZ(0px)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {/* Left: checkmark + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Green checkmark circle */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: "var(--primary)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px oklch(from var(--primary) l c h / 0.4)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary-foreground)"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <span
                style={{
                  color: "oklch(from var(--foreground) l c h / 0.9)",
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {card.title}
              </span>
            </div>

            {/* Right: rate value */}
            <span
              style={{
                color: "oklch(from var(--foreground) l c h / 0.4)",
                fontSize: 11,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}
            >
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RateCards;
