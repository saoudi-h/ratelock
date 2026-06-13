"use client";

import { useReplayOnBfcache } from "./_hooks/use-replay-on-bfcache";

/**
 * Wraps the home page and replays all GSAP animations when the page
 * is restored from bfcache (back-forward cache).
 *
 * This is the root-level component that hosts the pageshow listener.
 * Individual components register their timelines via registerReplay().
 */
export function BfcacheRemount({ children }: { children: React.ReactNode }) {
  useReplayOnBfcache();
  return <>{children}</>;
}
