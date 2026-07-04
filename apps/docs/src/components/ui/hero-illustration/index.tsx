"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/app/(home)/_lib/gsap";
import { BasePlate } from "./base-plate";
import { GlassPane } from "./glass-pane";
import { RateCards } from "./rate-cards";
import { ConnectionLines } from "./connection-lines";
import { LAYOUT } from "./layout-config";
import styles from "./hero-illustration.module.css";

interface HeroIllustrationProps {
  className?: string;
}

/**
 * Generates a smooth, wavy Bezier spline path connecting 6 data points.
 * Uses horizontal tangent control points to guarantee infinite smoothness at join points.
 */
const getBezierPath = (points: number[]) => {
  const xCoords = [0, 64, 128, 192, 256, 320, 384];
  let d = `M 0 ${points[0]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = xCoords[i] + 32;
    const cp1y = points[i];
    const cp2x = xCoords[i + 1] - 32;
    const cp2y = points[i + 1];
    const targetX = xCoords[i + 1];
    const targetY = points[i + 1];
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
  }
  return d;
};

/**
 * 3D isometric rate-limiting illustration built with CSS 3D transforms.
 * Contains client-side ResizeObserver scaling, section-wide Z-axis hover tilt,
 * and a real-time request traffic simulation.
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  const { glassPane, rateCards } = LAYOUT;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  // Dynamic simulation DOM element refs
  const totalTextRef = useRef<HTMLDivElement>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);
  const chartStrokeRef = useRef<SVGPathElement>(null);
  const chartFillRef = useRef<SVGPathElement>(null);
  const cardValueRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const designWidth = 630;
  const designHeight = 380;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Measure and adjust wrapper scale
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || container.clientWidth || designWidth;
      const newScale = Math.min(1, width / designWidth);
      setScale(newScale);
    };

    handleResize();
    setIsMounted(true);

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(container);

    // 2. Register hover mouse tilt listener over the ENTIRE Hero Section parent
    const section = container.closest("section");
    if (section) {
      const handleSectionMouseMove = (e: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        // Mouse coordinate relative to the horizontal center of the entire hero section
        const x = e.clientX - rect.left - rect.width / 2;
        
        // Very subtle yaw rotation around the Z-axis (max 4 degrees)
        const tiltZ = (x / (rect.width / 2)) * 4;
        
        gsap.to(container, {
          "--tilt-z": tiltZ,
          duration: 0.8, // slower duration makes it feel heavy and extremely fluid
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const handleSectionMouseLeave = () => {
        // Smoothly animate back to center
        gsap.to(container, {
          "--tilt-z": 0,
          duration: 1.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      section.addEventListener("mousemove", handleSectionMouseMove);
      section.addEventListener("mouseleave", handleSectionMouseLeave);

      return () => {
        observer.disconnect();
        section.removeEventListener("mousemove", handleSectionMouseMove);
        section.removeEventListener("mouseleave", handleSectionMouseLeave);
      };
    }

    return () => {
      observer.disconnect();
    };
  }, [scale]);

  // Setup GSAP entrance animations & dynamic simulation loops
  useGSAP(() => {
    registerGsap();

    const tl = gsap.timeline({
      delay: 0.25,
    });

    // ── Entrance: Base Plate fades in and scales slightly ──
    tl.from('[data-animate="base-plate-top"]', {
      opacity: 0,
      scale: 0.85,
      duration: 1.2,
      ease: "expo.out",
    }, 0);

    tl.from('[data-animate="base-plate-depth"]', {
      opacity: 0,
      z: -30,
      stagger: 0.02,
      duration: 1,
      ease: "expo.out",
    }, 0.1);

    // Fade in shadows
    tl.from('[data-animate="shadow"]', {
      opacity: 0,
      scale: 0.6,
      duration: 1.2,
      ease: "expo.out",
    }, 0.2);

    // ── Entrance: Glass Pane rises up ──
    tl.from('[data-animate="glass-pane-inner"]', {
      y: 60,
      opacity: 0,
      duration: 1.3,
      ease: "back.out(1.1)",
    }, 0.35);

    // ── Entrance: Connection lines fade/draw in ──
    tl.from('[data-animate="connection-line"]', {
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
    }, 0.5);

    tl.from('[data-animate="connection-line-core"]', {
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
    }, 0.55);

    // ── Entrance: Rate cards float in staggered from the right ──
    tl.from('[data-animate="rate-card-inner"]', {
      x: 40,
      y: 15,
      opacity: 0,
      stagger: 0.12,
      duration: 1.3,
      ease: "back.out(1.3)",
    }, 0.45);

    // ── Idle Loops and Dynamic Simulation (Starts after entrance completes) ──
    tl.add(() => {
      // Bobbing of floating elements group
      gsap.to('[data-animate="floating-elements"]', {
        y: -10,
        duration: 3.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Flowing dotted connection lines (requests travelling)
      gsap.to('[data-animate="connection-line-core"]', {
        strokeDashoffset: -18,
        duration: 1.2,
        ease: "none",
        repeat: -1,
      });

      // Pulsing checkmark glows
      gsap.to('[data-animate="card-check"]', {
        filter: "drop-shadow(0 0 10px oklch(from var(--primary) l c h / 0.7)) drop-shadow(0 0 2px var(--primary))",
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.3,
          from: "random",
        },
      });

      // ── Real-time Traffic Simulator Loop ──
      // Default starting coordinates for chart (exact visual representation of initial SVG)
      const currentPoints = [100, 115, 85, 95, 35, 55, 75];
      // Default starting numerical values
      const currentValues = { login: 10, checkout: 30, search: 60, upload: 20, total: 120 };

      const updateSimulation = () => {
        // Generate new target traffic values in controlled ranges
        const targetLogin = gsap.utils.random(6, 43, 1);
        const targetCheckout = gsap.utils.random(18, 38, 1);
        const targetSearch = gsap.utils.random(30, 92, 1);
        const targetUpload = gsap.utils.random(10, 28, 1);
        const targetTotal = targetLogin + targetCheckout + targetSearch + targetUpload;

        // Map total requests (typically 80 to 160) to a y6 coordinate (ranges from 30 to 110)
        // High traffic = lower Y coordinate (rising line)
        const nextY = 120 - ((targetTotal - 70) / 100) * 80;
        const clampedY = Math.max(30, Math.min(110, nextY));

        // Shift chart history left and append new coordinate
        currentPoints.shift();
        currentPoints.push(clampedY);

        if (chartStrokeRef.current && chartFillRef.current) {
          const strokeD = getBezierPath(currentPoints);
          chartStrokeRef.current.setAttribute("d", strokeD);
          chartFillRef.current.setAttribute("d", strokeD + " L 384 140 L 0 140 Z");
        }

        // Animate card counters rolling smoothly over 2.4s
        gsap.to(currentValues, {
          login: targetLogin,
          checkout: targetCheckout,
          search: targetSearch,
          upload: targetUpload,
          total: targetTotal,
          duration: 2.4,
          ease: "power1.inOut",
          onUpdate: () => {
            if (cardValueRefs.current[0]) cardValueRefs.current[0].textContent = Math.round(currentValues.login) + " req/s";
            if (cardValueRefs.current[1]) cardValueRefs.current[1].textContent = Math.round(currentValues.checkout) + " req/s";
            if (cardValueRefs.current[2]) cardValueRefs.current[2].textContent = Math.round(currentValues.search) + " req/s";
            if (cardValueRefs.current[3]) cardValueRefs.current[3].textContent = Math.round(currentValues.upload) + " req/s";
            if (totalTextRef.current) totalTextRef.current.textContent = Math.round(currentValues.total) + " req/s";
          }
        });
      };

      // Set up a repeating GSAP tween to drive the horizontal scroll and trigger updates.
      // This is perfectly synchronized with GSAP's tick loop and has zero timer drift.
      const simScrollTween = gsap.fromTo(chartSvgRef.current,
        { "--chart-tx": 0 },
        {
          "--chart-tx": -64,
          duration: 2.4,
          ease: "none",
          repeat: -1,
          onStart: updateSimulation,
          onRepeat: updateSimulation,
        }
      );

      return () => {
        simScrollTween.kill();
      };
    });
  }, { scope: containerRef });

  // Compute positions for ground shadows dynamically
  const glassShadowTop = glassPane.top + glassPane.height; // 220
  const glassShadowLeft = glassPane.left - 30; // -140
  const rateCardsHeight = 4 * rateCards.cardHeight + 3 * rateCards.gap; // 204
  const rateCardsShadowTop = rateCards.top + rateCardsHeight; // 104
  const rateCardsShadowLeft = rateCards.left - 25; // 155

  return (
    <div
      ref={containerRef}
      className={`
        ${styles.illustration}
        ${className ?? ""}
      `}
      style={{
        position: "relative",
        perspective: 2000,
        width: "100%",
        maxWidth: designWidth,
        height: designHeight * scale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        opacity: isMounted ? 1 : 0,
        transition: "opacity 0.4s ease-out, height 0.15s ease-out",
        overflow: "visible",
      }}
    >
      <div
        data-animate="3d-scene"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) scale(${scale}) rotateX(65deg) rotateZ(calc(40deg + var(--tilt-z, 0) * 1deg))`,
        }}
      >
        <BasePlate />

        {/* ── Ground Shadows for Vertical Elements (lying flat on the XY plane) ── */}
        {/* Glass Pane Ground Shadow */}
        <div
          data-animate="shadow"
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
          data-animate="shadow"
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

        {/* Group of floating elements that bob together */}
        <div
          data-animate="floating-elements"
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
          }}
        >
          <ConnectionLines />
          <GlassPane
            totalRef={totalTextRef}
            chartSvgRef={chartSvgRef}
            chartStrokeRef={chartStrokeRef}
            chartFillRef={chartFillRef}
          />
          <RateCards valueRefs={cardValueRefs} />
        </div>
      </div>
    </div>
  );
}

export default HeroIllustration;
