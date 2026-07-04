"use client";

import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";
import { ArrowRightBold } from "@solar-icons/react-perf";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { gsap, registerGsap } from "../../_lib/gsap";
import { registerReplay } from "../../_lib/replay-registry";

interface HeroCtasProps {
  /** Command to copy from the inline npm tile */
  command?: string;
}

/**
 * Primary / secondary CTAs + an inline "npm i" copy chip.
 *
 * The three items enter staggered from below with a soft blur — the
 * primary CTA leads the stagger so the eye lands on it first.
 */
export function HeroCtas({ command = "npm install @ratelock/local" }: HeroCtasProps) {
  registerGsap();
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useGSAP(
    () => {
      if (!ref.current) return;
      const wrap = ref.current;
      const items = wrap.children;
      const tl = gsap.fromTo(
        items,
        { y: 24, opacity: 0, filter: "blur(6px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.08,
          delay: 0.55,
          onStart: () => wrap.classList.remove("gsap-prep"),
          onInterrupt: () => {
            gsap.set(items, {
              y: 0,
              opacity: 1,
              clearProps: "filter",
            });
            wrap.classList.remove("gsap-prep");
          },
        },
      );
      return registerReplay(() => {
                tl.restart(true, false)
            });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="
        gsap-prep mt-8 flex flex-col items-start gap-3
        sm:flex-row sm:flex-wrap sm:items-center sm:gap-4
      "
    >
      <div className="flex items-center gap-4">

        <Button
          render={<Link href="/docs" />}
          variant="solid"
          size="xl"
          className="shadow-sm"
        >
          <span>Get Started</span>
          <ArrowRightBold
            className="
              size-4 transition-transform duration-200
              group-hover/button:translate-x-0.5
            "
          />
        </Button>

        <Button
          render={
            <a
              href="https://github.com/saoudi-h/ratelock"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          variant="outline"
          size="xl"
          className="shadow-sm"
        >
          <Icon icon="mdi:github" className="size-4" />
          <span>GitHub</span>
        </Button>
      </div>
      <button
        onClick={handleCopy}
        title="Copy install command"
        className="
          group flex h-12 w-full items-center justify-between gap-3 rounded-2xl
          border border-border/40 bg-muted/40 px-5 font-mono text-xs
          font-semibold text-muted-foreground shadow-xs transition-all
          duration-200 select-none
          hover:bg-muted/80 hover:text-foreground
          active:scale-[0.97]
          sm:w-auto
        "
      >
        <span
          className="
            mr-1 text-primary opacity-70 transition-opacity
            group-hover:opacity-100
          "
        >
          $
        </span>
        <span>npm i @ratelock/local</span>
        <div className="mx-1 h-4 w-px bg-border/40" />
        {copied ? (
          <Icon icon="lucide:check" className="size-4 text-emerald-500" />
        ) : (
          <Icon
            icon="lucide:copy"
            className="
              size-3.5 text-muted-foreground transition-colors
              group-hover:text-foreground
            "
          />
        )}
      </button>
    </div>
  );
}
