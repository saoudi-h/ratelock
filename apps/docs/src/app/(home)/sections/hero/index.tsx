"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap } from "../../_lib/gsap";
import { registerReplay } from "../../_lib/replay-registry";
import { HeroBadge } from "./hero-badge";
import { HeroIllustration } from "@/components/ui/hero-illustration";
import { HeroCtas } from "./hero-ctas";
import { HeroScrollCue } from "./hero-scroll-cue";
import { HeroStats } from "./hero-stats";
import { HeroTitle } from "./hero-title";

/**
 * Hero is split into two stacked layers:
 *
 *  1. A full-viewport intro (`h-svh`) that holds the badge, title,
 *     description, CTAs and the rotating code panel. The title pulls
 *     itself apart with SplitText, the code panel slides in with a 3D
 *     tilt, the CTAs cascade in last.
 *
 *  2. A stats strip right after, which has its own scroll entrance —
 *     cards rise + tilt, each value scrambles letter-by-letter.
 *
 * The whole section also has an ambient parallax: a soft glow drifts
 * counter to the scroll, and the title gently lifts off as you start
 * scrolling so the transition into the next section is felt.
 */
export function HeroSection() {
  registerGsap();
  const ambientRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (descRef.current) {
      const desc = descRef.current;
      const descTl = gsap.fromTo(
        desc,
        { y: 16, opacity: 0, filter: "blur(6px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "expo.out",
          delay: 0.85,
          onStart: () => desc.classList.remove("gsap-prep"),
          onInterrupt: () => {
            gsap.set(desc, { y: 0, opacity: 1, clearProps: "filter" });
            desc.classList.remove("gsap-prep");
          },
        },
      );
      return registerReplay(() => descTl.restart(true, false));
    }

    if (ambientRef.current) {
      gsap.to(ambientRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: ambientRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  });

  return (
    <section
      className="
              relative isolate flex min-h-[calc(100svh-3.5rem)] flex-col
              overflow-hidden bg-background
            "
    >
      {/* Ambient gradient halo */}
      <div
        ref={ambientRef}
        aria-hidden
        className="
                  pointer-events-none absolute -top-1/3 left-1/2 -z-10
                  h-[120%] w-[120%] -translate-x-1/2 opacity-50
                  [background:radial-gradient(circle_at_30%_20%,var(--color-primary)/0.18,transparent_45%),radial-gradient(circle_at_75%_60%,var(--color-secondary)/0.10,transparent_50%)]
                  blur-3xl
                "
      />

      {/* Top content area: badge + title + desc + CTAs + code panel
                + scroll cue. The scroll cue sits in the flow (not
                absolute) so it doesn't overlap with the stats row
                below. */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-start xl:items-center">
          <div className="relative mx-auto w-full max-w-7xl px-6 pt-8 pb-4 xl:py-4">
            <div
              className="
                              grid grid-cols-1 items-center gap-10
                              xl:grid-cols-12 xl:gap-6
                            "
            >
              <div
                className="
                                  relative flex flex-col justify-center
                                  xl:col-span-5 xl:pr-8
                                "
              >
                <div className="mb-4">
                  <HeroBadge />
                </div>

                <HeroTitle />

                <p
                  ref={descRef}
                  className="
                                      gsap-prep mt-3 max-w-xl text-base/relaxed text-muted-foreground
                                      md:text-lg
                                    "
                >
                  TypeScript rate limiting with multiple strategies,
                  <br />
                  storage engines and resilience policies.
                </p>

                <HeroCtas />
              </div>

              <div className="xl:col-span-7 flex justify-center w-full">
                <HeroIllustration className="w-full mx-auto" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-0.5">
          <HeroScrollCue />
        </div>
      </div>

      {/* Stats row — sits at the bottom of the hero so it
                shares the 100svh intro without becoming a separate
                section. */}
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-2 pb-6">
        <HeroStats />
      </div>
    </section>
  );
}
