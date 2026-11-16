# Closed issues

> Append-only history moved out of `.autonomos/ISSUES.md`. Not startup context; search by ID.

## From ISSUES.md (moved 2026-11-08)

## [ISSUE-001] Establish a searchable editorial surface for RateLock

- Type: proposal
- Status: resolved
- Evidence: RateLock has a technically rich strategy simulator, multiple storage engines, resilience policies, and framework integrations, but no durable editorial surface focused on the questions developers search before adopting a rate limiter. Organic discovery is currently very limited, and future articles or announcements need a canonical source that can be revisited and distributed through external channels over time. Fumadocs now provides blog-oriented primitives that may reduce the cost of establishing this surface, but the implementation approach remains open.
- Impact: Developers who could benefit from RateLock have few paths to discover it through search or framework-specific learning resources. The project also lacks a consistent place to publish durable explanations, connect them to the documentation, playground, and packages, and measure whether editorial work creates qualified visits and adoption.
- Desired outcome: RateLock has an owned, maintainable, searchable editorial surface with clear article metadata, durable URLs, useful navigation and internal linking, references to relevant documentation and interactive proof, and a lightweight publishing workflow suitable for occasional high-quality articles and later distribution to social and community channels.
- Tasks: BLOG-01, BLOG-02

## [HOME-01] Reopened 2026-11-16

- HOME-01 was reopened to `.autonomos/ISSUES.md`: HOME-FIX-01 did not resolve the flicker on physical phones. Current evidence and the root-cause finding are recorded there; the original closed record is superseded, not deleted.

## Closed 2026-11-16

## [HOME-02] Horizontal scroll on mobile home page appears then resolves

- Type: problem
- Status: resolved
- Evidence: On arriving at the home page in mobile viewport, content is offset and a horizontal scroll of a few dozen pixels to the right is available (screenshot shows the whole page framed with a visible right gutter). Continuing to scroll makes the overflow disappear on its own.
- Impact: Mobile layout looks misaligned on first paint and allows sideways panning; a layout shift/overflow source is active during hydration.
- Desired outcome: Home page has no horizontal overflow at any point from first paint through hydration and scrolling in a mobile viewport.
- Tasks: HOME-FIX-01
- Resolution: Fixed by HOME-FIX-01 — see `.autonomos/worklogs/2026-11-16-HOME-FIX-01.md`; verified at 390px viewport with zero document overflow.

## Closed 2026-11-16

## [HOME-01] Hero illustration flickers and animates chaotically on mobile

- Type: problem
- Status: resolved
- Evidence: On physical phones (Chrome AND Firefox), the hero illustration's parts light up and go dark at high speed, randomly; desktop browsers are stable. HOME-FIX-01 (mouse-only tilt, one simulation tween per cycle, lagSmoothing restored in `gsap.ts`) was deployed and did NOT fix it: `LenisGsapBridge` in `apps/docs/src/routes/__root.tsx:83` calls `gsap.ticker.lagSmoothing(0)` after `registerGsap()`, overriding the fix. Other contributors: an animated `filter: drop-shadow(oklch(from ...))` pulse with random stagger, a ResizeObserver↔height feedback loop, and per-cycle GSAP tweens accumulating in the context.
- Impact: The landing page's main visual is broken for mobile visitors on both major browsers; the first fix attempt failed, so a verified device-level result is required.
- Desired outcome: The illustration animates stably on physical phones with no rapid/ random light-up or dropout, verified after deployment.
- Tasks: HOME-FIX-02
- Resolution: Fixed by HOME-FIX-02 — see `.autonomos/worklogs/2026-11-16-HOME-FIX-02.md`; pending the maintainer's physical-phone check after deployment.

## Closed 2026-11-16

## [HOME-03] Hero illustration compositing fails on mobile GPUs

- Type: problem
- Status: resolved
- Evidence: Despite HOME-FIX-02 (lagSmoothing, opacity pulse, no ResizeObserver loop), the 3D illustration still flickered on a Samsung S23 in Chrome and Firefox, with objects missing at random between reloads. Elimination tests proved stability only when all 3D transforms were neutralized; the same page worked on an old desktop. Maintainer accepted hiding the illustration on mobile.
- Impact: A broken main visual on mobile; a functional page is preferred over a decorative gadget that fails.
- Desired outcome: No visible flicker or layout break on mobile, while keeping the illustration on desktop.
- Tasks: HOME-FIX-03
- Resolution: Fixed by HOME-FIX-03 — see `.autonomos/worklogs/2026-11-17-HOME-FIX-03.md`; verified by the maintainer on an S23 via the LAN dev server.
