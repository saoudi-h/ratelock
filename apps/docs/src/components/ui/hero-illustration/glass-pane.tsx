import React from "react";
import { LAYOUT } from "./layout-config";

/**
 * Vertical glass panel standing on the left side of the base plate.
 *
 * Stands vertically via `translateZ(32px) rotateX(-90deg)`.
 * Extrudes 7 layers backward to create volumetric depth.
 * Contains a shield icon, a rate badge, and an unclipped line chart.
 */
export function GlassPane() {
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
            "linear-gradient(135deg, oklch(from var(--card) l c h / 0.5), oklch(from var(--card) l c h / 0.12))",
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          {/* Rate badge */}
          <div
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
          viewBox="0 0 320 140"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: LAYOUT.glassPane.chartHeight,
            zIndex: 1,
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

          {/* Area fill - scaled to fit 320px width without edge cutting */}
          <path
            d="M 0 100 C 45 115, 80 65, 115 85 C 150 105, 195 35, 230 35 C 265 35, 290 75, 320 55 L 320 140 L 0 140 Z"
            fill="url(#chartFill)"
          />

          {/* Stroke line - scaled */}
          <path
            d="M 0 100 C 45 115, 80 65, 115 85 C 150 105, 195 35, 230 35 C 265 35, 290 75, 320 55"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            filter="url(#chartGlow)"
          />

          {/* Data vertices */}
          <circle cx="115" cy="85" r="3" fill="var(--primary)" />

          {/* Highlighted peak vertex */}
          <circle
            cx="230"
            cy="35"
            r="4.5"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="2"
            filter="url(#chartGlow)"
          />
        </svg>
      </div>
    </div>
  );
}

export default GlassPane;
