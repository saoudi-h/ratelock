"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Provider as JotaiProvider } from "jotai";
import type { LenisRef } from "lenis/react";
import { ReactLenis } from "lenis/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React, { useEffect, useRef } from "react";
import { gsap, registerGsap, ScrollTrigger } from "./(home)/_lib/gsap";

/**
 * Bridges Lenis with GSAP's ticker so that ScrollTrigger reads positions
 * from the smoothed scroll instead of native scroll events. Pattern from
 * Darkroom Engineering's official Lenis docs.
 */
function LenisGsapBridge() {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    registerGsap();

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        allowNestedScroll: true,
        autoRaf: false,
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        syncTouch: false,
      }}
    />
  );
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <JotaiProvider>
      <RootProvider>
        <NuqsAdapter>
          <TooltipProvider>
            <LenisGsapBridge />
            {children}
            <Toaster />
          </TooltipProvider>
        </NuqsAdapter>
      </RootProvider>
    </JotaiProvider>
  );
};

export default Providers;
