import React from "react";
import { LAYOUT } from "./layout-config";
import { ShieldMinimalistic } from "@solar-icons/react-perf/BoldDuotone";

interface GlassPaneProps {
  totalRef?: React.RefObject<HTMLDivElement | null>;
  chartSvgRef?: React.RefObject<SVGSVGElement | null>;
  chartStrokeRef?: React.RefObject<SVGPathElement | null>;
  chartFillRef?: React.RefObject<SVGPathElement | null>;
}

/**
 * Vertical glass panel standing on the left side of the base plate.
 *
 * Stands vertically via `translateZ(32px) rotateX(-90deg)`.
 * Extrudes 7 layers backward to create volumetric depth.
 * Contains a shield icon, a rate badge, and an unclipped line chart.
 */
export function GlassPane({
  totalRef,
  chartSvgRef,
  chartStrokeRef,
  chartFillRef,
}: GlassPaneProps) {
  const { left, top, width, height, elevation } = LAYOUT.glassPane;
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        left,
        top,
        transformOrigin: "bottom center",
        transform: `translateZ(${elevation}px) rotateX(-90deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        data-animate="glass-pane-inner"
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
        }}
      >
        {/* ── Extruded Back Face Layers (receding backward) ── */}
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={`glass-depth-${i}`}
            style={{
              position: "absolute",
              inset: 0,
              background: "oklch(from var(--card) l c h / 0.02)",
              border: "1px solid oklch(from var(--primary) l c h / 0.12)",
              borderRadius: 14,
              transform: `translateZ(${-(i + 1) * 0.8}px)`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* ── Front Face Layer ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, oklch(from var(--card) l c h / 0.65), oklch(from var(--card) l c h / 0.3))",
            border: "1px solid oklch(from var(--primary) l c h / 0.2)",
            borderRadius: 14,
            boxShadow:
              "0 2px 8px oklch(from var(--foreground) l c h / 0.05), inset 0 0 30px oklch(from var(--primary) l c h / 0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transform: "translateZ(0px)",
          }}
        >
          {/* ── Frost overlay (subtle noise texture) ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 30% 20%, oklch(from var(--primary) l c h / 0.06), transparent 60%)",
              borderRadius: 14,
              pointerEvents: "none",
            }}
          />
          {/* ── Header row ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "16px 18px",
              zIndex: 2,
              position: "relative",
            }}
          >
            {/* Shield icon */}
            <div
              style={{
                width: 32,
                height: 32,
                background: "oklch(from var(--primary) l c h / 0.06)",
                border: "1px solid oklch(from var(--primary) l c h / 0.3)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <ShieldMinimalistic size={18} />
            </div>

            {/* Rate badge */}
            <div
              ref={totalRef}
              style={{
                background: "oklch(from var(--primary) l c h / 0.1)",
                color: "var(--primary)",
                padding: "5px 12px",
                borderRadius: 16,
                fontSize: 11,
                fontWeight: 600,
                border: "1px solid oklch(from var(--primary) l c h / 0.35)",
                boxShadow: "0 0 12px oklch(from var(--primary) l c h / 0.15)",
                fontFamily: "monospace",
                alignSelf: "flex-start",
              }}
            >
              120 req/s
            </div>
          </div>

          {/* ── Wave line chart ── */}
          <svg
            ref={chartSvgRef}
            viewBox="0 0 384 140"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 384,
              height: LAYOUT.glassPane.chartHeight,
              zIndex: 1,
              transform: "translateX(calc(var(--chart-tx, 0) * 1px))",
            }}
          >
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Area fill - scaled to fit 384px width */}
            <path
              ref={chartFillRef}
              d="M 0 100 C 32 100, 32 115, 64 115 C 96 115, 96 85, 128 85 C 160 85, 160 95, 192 95 C 224 95, 224 35, 256 35 C 288 35, 288 55, 320 55 C 352 55, 352 75, 384 75 L 384 140 L 0 140 Z"
              fill="url(#chartFill)"
            />

            {/* Stroke line */}
            <path
              ref={chartStrokeRef}
              d="M 0 100 C 32 100, 32 115, 64 115 C 96 115, 96 85, 128 85 C 160 85, 160 95, 192 95 C 224 95, 224 35, 256 35 C 288 35, 288 55, 320 55 C 352 55, 352 75, 384 75"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              filter="url(#chartGlow)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default GlassPane;
