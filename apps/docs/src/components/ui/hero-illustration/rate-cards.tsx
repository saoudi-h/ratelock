import React from "react";
import { LAYOUT } from "./layout-config";
import { CheckCircle } from "@solar-icons/react-perf/BoldDuotone";

const CARDS = [
  { title: "Login", value: "10 req/s" },
  { title: "Checkout", value: "30 req/s" },
  { title: "Search", value: "60 req/s" },
  { title: "Upload", value: "20 req/s" },
] as const;

interface RateCardsProps {
  valueRefs?: React.RefObject<(HTMLSpanElement | null)[]>;
}

/**
 * Four floating rate-limit cards standing on the right side of the base plate.
 * Floats vertically via `translateZ(45px) rotateX(-90deg)`.
 * Extrudes 6 layers backward to create volumetric depth blocks.
 */
export function RateCards({ valueRefs }: RateCardsProps) {
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
      {CARDS.map((card, idx) => (
        <div
          key={card.title}
          style={{
            position: "relative",
            width,
            height: cardHeight,
            transformStyle: "preserve-3d",
          }}
        >
          <div
            data-animate="rate-card-inner"
            style={{
              position: "absolute",
              inset: 0,
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
                  border: "1px solid oklch(from var(--hero-border) calc(l - 0.08) c h / 0.2)",
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
                border: "1px solid var(--hero-border)",
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle
                    size={20}
                    color="var(--primary)"
                    data-animate="card-check"
                    style={{ filter: "drop-shadow(0 0 6px oklch(from var(--primary) l c h / 0.4))" }}
                  />
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
                ref={(el) => {
                  valueRefs.current[idx] = el;
                }}
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
        </div>
      ))}
    </div>
  );
}

export default RateCards;
