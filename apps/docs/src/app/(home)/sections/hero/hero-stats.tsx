"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { BentoBase } from "../../components/bento-base";
import { gsap, registerGsap, SplitText } from "../../_lib/gsap";
import { registerReplay } from "../../_lib/replay-registry";

interface Stat {
  value: string;
  label: string;
  desc: string;
}

const STATS: Stat[] = [
  {
    value: "4",
    label: "Strategies",
    desc: "Fixed Window, Sliding Window, Token Bucket and Leaky Bucket.",
  },
  {
    value: "3",
    label: "Storage Engines",
    desc: "Memory, Redis, PostgreSQL",
  },
  {
    value: "Atomic",
    label: "Operations",
    desc: "Concurrency-safe updates with consistent rate limit enforcement.",
  },
  {
    value: "Built-in",
    label: "Resilience",
    desc: "Retries, circuit breakers and fallback policies out of the box.",
  },
];

/**
 * The four-stat row at the bottom of the hero.
 *
 * Each card has its own scripted entrance:
 *   - cards rise from below with a tiny vertical stagger
 *   - the big value glyphs scramble in via a per-character SplitText
 *   - meta text fades and slides up after the digit lands
 *
 * Now that the stats live inside the hero, the entrance fires on
 * load (no scrollTrigger) so they're animated alongside the rest
 * of the intro. The wrapper starts with `.gsap-prep` so the row
 * doesn't flash visible before GSAP hydrates, and `onInterrupt`
 * forces the natural state in case the tween is killed (React 19
 * Strict Mode double-mount, fast unmount, etc.).
 */
export function HeroStats() {
  registerGsap();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const wrap = ref.current;
      const cards = gsap.utils.toArray<HTMLElement>("[data-stat-card]", wrap);

      // Prepare SplitText for all value elements up front
      const splits = cards
        .map((card) => {
          const valueEl = card.querySelector<HTMLElement>("[data-stat-value]");
          if (!valueEl) return null;
          return { card, valueEl, split: SplitText.create(valueEl, { type: "chars" }) };
        })
        .filter(Boolean) as Array<{
        card: HTMLElement;
        valueEl: HTMLElement;
        split: SplitText;
      }>;

      const tl = gsap.timeline({
        delay: 0.6,
        onStart: () => wrap.classList.remove("gsap-prep"),
        onInterrupt: () => {
          gsap.set(cards, {
            y: 0,
            rotateX: 0,
            opacity: 1,
            clearProps: "filter,transform",
          });
          splits.forEach(({ split }) => {
            gsap.set(split.chars, {
              yPercent: 0,
              rotateX: 0,
              opacity: 1,
              clearProps: "transform",
            });
          });
          splits.forEach(({ card }) => {
            const labelEl = card.querySelector<HTMLElement>("[data-stat-label]");
            const descEl = card.querySelector<HTMLElement>("[data-stat-desc]");
            if (labelEl) gsap.set(labelEl, { y: 0, opacity: 1 });
            if (descEl) gsap.set(descEl, { y: 0, opacity: 1 });
          });
          wrap.classList.remove("gsap-prep");
        },
      });

      // Cards rise + tilt forward
      tl.fromTo(
        cards,
        { y: 80, rotateX: -12, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.09,
        },
        0,
      );

      // Per-card value scramble + label / desc
      splits.forEach(({ split, card }, i) => {
        const labelEl = card.querySelector<HTMLElement>("[data-stat-label]");
        const descEl = card.querySelector<HTMLElement>("[data-stat-desc]");

        tl.fromTo(
          split.chars,
          { yPercent: 90, rotateX: 70, opacity: 0 },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.7,
            ease: "back.out(1.4)",
            stagger: 0.03,
          },
          0.18 + i * 0.09,
        );
        if (labelEl) {
          tl.fromTo(
            labelEl,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: "expo.out" },
            0.18 + i * 0.09 + 0.35,
          );
        }
        if (descEl) {
          tl.fromTo(
            descEl,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: "expo.out" },
            0.18 + i * 0.09 + 0.4,
          );
        }
      });

      // Register for bfcache replay (restart timeline, don't re-split)
      registerReplay(() => tl.restart(true, false));

      return () => { splits.forEach(({ split }) => split.revert()); };
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="
              gsap-prep grid grid-cols-2 gap-3
              [perspective:1000px]
              sm:gap-4
              lg:grid-cols-4 lg:gap-4
            "
    >
      {STATS.map((stat) => {
        const isLong = stat.value.length > 6;
        const fontSize = isLong ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl md:text-5xl";
        return (
          <BentoBase key={stat.label} wrapperClassName="" density="compact" data-stat-card>
            <div
              data-stat-value
              className={`
                              font-heading leading-none font-black tracking-tighter
                              text-foreground/50 transition-colors duration-200
                              text-shadow-xs
                              group-hover:text-primary/80
                              ${fontSize}
                            `}
            >
              {stat.value}
            </div>
            <div className="mt-4 pt-3">
              <div
                data-stat-label
                className="
                                  text-[11px] font-bold tracking-wider text-muted-foreground
                                  uppercase
                                "
              >
                {stat.label}
              </div>
              <div
                data-stat-desc
                className="
                                  mt-1 text-[10.5px] leading-normal font-medium
                                  text-muted-foreground/70
                                "
              >
                {stat.desc}
              </div>
            </div>
          </BentoBase>
        );
      })}
    </div>
  );
}
