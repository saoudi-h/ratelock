"use client";

import { useEffect } from "react";
import { replayAll } from "../_lib/replay-registry";
import { ScrollTrigger } from "../_lib/gsap";

/**
 * Listens for bfcache restoration (pageshow with persisted=true)
 * and replays all registered GSAP timelines.
 *
 * Uses double requestAnimationFrame to let the browser finish
 * restoring layout/scroll before replaying animations.
 *
 * Call this once near the root of the app (e.g., in BfcacheRemount).
 */
export function useReplayOnBfcache() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;

      // Double rAF: let the browser finish restoring layout/scroll first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          replayAll();
          ScrollTrigger.refresh();
        });
      });
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}
