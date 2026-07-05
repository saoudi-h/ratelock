"use client";

type RestartFn = () => void;

const registry = new Set<RestartFn>();

/**
 * Register a GSAP timeline restart callback.
 * Called inside useGSAP to register the timeline for bfcache replay.
 * Returns an unregister function for cleanup on actual unmount.
 */
export function registerReplay(fn: RestartFn): () => void {
  registry.add(fn);
  return () => registry.delete(fn);
}

/**
 * Replay all registered GSAP timelines.
 * Called on pageshow with persisted=true (bfcache restoration).
 */
export function replayAll(): void {
  registry.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("[replay-registry] Error replaying animation:", e);
    }
  });
}
