import { BasePlate } from "./base-plate";
import { GlassPane } from "./glass-pane";
import { RateCards } from "./rate-cards";
import { ConnectionLines } from "./connection-lines";
import { LAYOUT } from "./layout-config";

interface HeroIllustrationProps {
  className?: string;
}

/**
 * 3D isometric rate-limiting illustration built with CSS 3D transforms.
 *
 * Structure (all children share the same preserve-3d context):
 *   1. BasePlate        – dark slab lying flat on the ground plane (XY)
 *   2. ConnectionLines  – floating 3D paths rotated into the vertical YZ-plane
 *   3. GlassPane        – vertical panel standing on the left
 *   4. RateCards        – 4 floating cards standing on the right
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  const { glassPane, rateCards } = LAYOUT;
  
  // Compute positions for ground shadows dynamically
  const glassShadowTop = glassPane.top + glassPane.height; // 220
  const glassShadowLeft = glassPane.left - 30; // -140
  const rateCardsHeight = 4 * rateCards.cardHeight + 3 * rateCards.gap; // 204
  const rateCardsShadowTop = rateCards.top + rateCardsHeight; // 104
  const rateCardsShadowLeft = rateCards.left - 25; // 155

  return (
    <div
      className={className}
      style={{
        perspective: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 380,
      }}
    >
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(65deg) rotateZ(40deg)",
        }}
      >
        <BasePlate />

        {/* ── Ground Shadows for Vertical Elements (lying flat on the XY plane) ── */}
        {/* Glass Pane Ground Shadow */}
        <div
          style={{
            position: "absolute",
            left: glassShadowLeft,
            top: glassShadowTop,
            width: glassPane.width,
            height: 110,
            background: "linear-gradient(to bottom, var(--hero-shadow-color), transparent)",
            transform: "translateZ(1px) skewX(-15deg)",
            transformOrigin: "top center",
            filter: "blur(10px)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
        {/* Rate Cards Ground Shadow */}
        <div
          style={{
            position: "absolute",
            left: rateCardsShadowLeft,
            top: rateCardsShadowTop,
            width: rateCards.width,
            height: 130,
            background: "linear-gradient(to bottom, var(--hero-shadow-color), transparent)",
            transform: "translateZ(1px) skewX(-15deg)",
            transformOrigin: "top center",
            filter: "blur(12px)",
            opacity: 0.8,
            pointerEvents: "none",
          }}
        />

        <ConnectionLines />
        <GlassPane />
        <RateCards />
      </div>
    </div>
  );
}

export default HeroIllustration;
