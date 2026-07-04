"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap, ScrollTrigger, SplitText } from "../../_lib/gsap";
import { registerReplay } from "../../_lib/replay-registry";

/**
 * The headline of the page. The first line is split via SplitText and
 * cascaded in from below with a slight blur + mask. The second line
 * (gradient text) fades in as a whole unit to preserve background-clip.
 *
 * On scroll, the whole title gently drifts upward (parallax) so the
 * hero feels deep even before the user knows to look for it.
 */
export function HeroTitle() {
  registerGsap();
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const heading = ref.current;
      const firstLine = heading.querySelector<HTMLElement>("[data-hero-line]");
      const gradientLine = heading.querySelector<HTMLElement>("[data-gradient-line]");

      // Hide via GSAP instead of CSS class — avoids ScrollTrigger
      // capturing the wrong "from" opacity value.
      gsap.set(heading, { opacity: 0 });

      // Split only the first line into words
      const split = firstLine
        ? SplitText.create(firstLine, { type: "words", mask: "words" })
        : null;

      if (split) {
        // Prevent lowercase letters with descenders (like 'g') from being cropped
        // by the overflow-hidden mask wrappers created by SplitText
        gsap.set(split.words, { paddingBottom: "5px", marginBottom: "-5px" });
      }

      let parallaxST: ScrollTrigger | null = null;

      const tl = gsap.timeline({
        delay: 0.15,
        onInterrupt: () => {
          if (split) {
            gsap.set(split.words, {
              yPercent: 0,
              rotateX: 0,
              opacity: 1,
              clearProps: "transform",
            });
          }
          if (gradientLine) {
            gsap.set(gradientLine, {
              y: 0,
              opacity: 1,
              clearProps: "filter",
            });
          }
          gsap.set(heading, { opacity: 1, clearProps: "transform" });
          if (parallaxST) {
            parallaxST.kill();
            parallaxST = null;
          }
        },
      });

      // Heading fade-in (controls parent opacity, replaces gsap-prep)
      tl.to(
        heading,
        {
          opacity: 1,
          duration: 0.8,
          ease: "expo.out",
        },
        0,
      );

      // First line: word cascade
      if (split) {
        tl.fromTo(
          split.words,
          {
            yPercent: 110,
            rotateX: -45,
            transformOrigin: "50% 50% -40px",
            opacity: 0,
          },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.06,
          },
          0,
        );
      }

      // Second line (gradient): fade in as whole unit to preserve background-clip
      if (gradientLine) {
        tl.fromTo(
          gradientLine,
          {
            y: 20,
            opacity: 0,
            filter: "blur(4px)",
          },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "expo.out",
          },
          "-=0.65",
        );
      }

      // Create parallax AFTER heading reaches opacity: 1 so ScrollTrigger
      // captures the correct "from" value instead of the hidden state.
      tl.call(() => {
        if (parallaxST) parallaxST.kill();
        parallaxST = ScrollTrigger.create({
          trigger: heading,
          start: "top top+=80",
          end: "bottom top",
          scrub: 0.4,
          animation: gsap.to(heading, {
            yPercent: -25,
            opacity: 0.4,
            ease: "none",
          }),
        });
      }, undefined, 0.8);

      // Register for bfcache replay (restart timeline, don't re-split)
      return registerReplay(() => {
        if (parallaxST) {
          parallaxST.kill();
          parallaxST = null;
        }
        tl.restart(true, false);
      });
      // SplitText revert happens on actual unmount via useGSAP cleanup
    },
    { scope: ref },
  );

  return (
    <h1
      ref={ref}
      style={{ opacity: 0 }}
      className="
        font-heading text-5xl leading-[1.15] font-black tracking-tight
        perspective-midrange
        sm:text-6xl
        lg:text-7xl
        xl:text-7xl
      "
    >
      <span data-hero-line className="block text-foreground">
        Rate limiting.
      </span>
      <span
        data-gradient-line
        className="text-gradient inline-block pb-1.5"
      >
        Done right.
      </span>
    </h1>
  );
}
