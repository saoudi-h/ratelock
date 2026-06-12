"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, registerGsap, SplitText } from "../../_lib/gsap";

/**
 * The headline of the page. Each word is split via SplitText and
 * cascaded in from below with a slight blur + mask. The second line
 * (muted) starts further along the timeline to feel like an echo of
 * the first.
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
      const lines = heading.querySelectorAll<HTMLElement>("[data-hero-line]");
      const splits = Array.from(lines).map((line) =>
        SplitText.create(line, { type: "words", mask: "words" }),
      );
      const allWords = splits.flatMap((s) => s.words);

      const tl = gsap.timeline({
        delay: 0.15,
        onStart: () => heading.classList.remove("gsap-prep"),
        onInterrupt: () => {
          gsap.set(allWords, {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            clearProps: "transform",
          });
          heading.classList.remove("gsap-prep");
        },
      });
      splits.forEach((split, i) => {
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
          i === 0 ? 0 : "-=0.65",
        );
      });

      // Subtle parallax on scroll out
      gsap.to(heading, {
        yPercent: -25,
        opacity: 0.4,
        ease: "none",
        scrollTrigger: {
          trigger: heading,
          start: "top top+=80",
          end: "bottom top",
          scrub: 0.4,
        },
      });

      return () => splits.forEach((s) => s.revert());
    },
    { scope: ref },
  );

  return (
    <h1
      ref={ref}
      className="
              gsap-prep font-heading text-5xl leading-[1.15] font-black tracking-tight
              [perspective:800px]
              sm:text-6xl
              lg:text-7xl
              xl:text-7xl
            "
    >
      <span data-hero-line className="block text-foreground">
        Rate limiting.
      </span>
      <span
        data-hero-line
        className="inline-block bg-linear-to-r from-foreground/70 to-primary
      bg-clip-text text-transparent"
      >
        Done right.
      </span>
    </h1>
  );
}
