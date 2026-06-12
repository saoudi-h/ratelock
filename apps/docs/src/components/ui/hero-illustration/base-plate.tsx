import React from "react";

/**
 * Isometric base platform with 3D vertical depth extrusion.
 *
 * The depth is created by stacking copies of the rounded rect straight down
 * along the negative local Z-axis using translateZ, ensuring a correct 3D block representation.
 */
export function BasePlate() {
  return (
    <>
      {/* ── Depth extrusion layers (extruding straight down) ── */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={`depth-${i}`}
          style={{
            position: "absolute",
            width: 440,
            height: 360,
            borderRadius: 28,
            background: "oklch(from var(--card) calc(l - 0.08) c h)",
            border: "1px solid oklch(from var(--border) l c h / 0.12)",
            transform: `translate(-50%, -50%) translateZ(${-(i + 1) * 1.5}px)`,
          }}
        />
      ))}

      {/* ── Top face ── */}
      <div
        style={{
          position: "absolute",
          width: 440,
          height: 360,
          borderRadius: 28,
          background: "linear-gradient(135deg, var(--card), var(--background))",
          border: "1px solid oklch(from var(--border) l c h / 0.5)",
          transform: "translate(-50%, -50%) translateZ(0px)",
          boxShadow: "var(--hero-shadow)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dot grid pattern (top-right corner, fading) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 150,
            height: 130,
            backgroundImage:
              "radial-gradient(oklch(from var(--primary) l c h / 0.18) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
            maskImage: "linear-gradient(to bottom left, black, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom left, black, transparent)",
          }}
        />
      </div>
    </>
  );
}

export default BasePlate;
