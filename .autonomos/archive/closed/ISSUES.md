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

## Closed 2026-11-16

## [HOME-01] Hero illustration flickers and animates chaotically on mobile Chrome

- Type: problem
- Status: resolved
- Evidence: On a physical phone with Chrome, the home hero illustration's elements appear/disappear at high frequency; the screenshot shows a distorted, partially drawn scene. Same page is stable on desktop Chrome and Firefox. A second screenshot taken on the maintainer's desktop (scroll test for HOME-02) shows the illustration animating normally, so the fault is device-specific.
- Impact: The landing page's main visual is broken for mobile Chrome visitors; first impression and perceived quality suffer on the primary traffic device class.
- Desired outcome: The hero illustration renders and animates with the same stable timing on mobile Chrome as on desktop, with no rapid flicker or element popping.
- Tasks: HOME-FIX-01
- Resolution: Fixed by HOME-FIX-01 — see `.autonomos/worklogs/2026-11-16-HOME-FIX-01.md`; physical-phone confirmation remains with the maintainer.

## Closed 2026-11-16

## [HOME-02] Horizontal scroll on mobile home page appears then resolves

- Type: problem
- Status: resolved
- Evidence: On arriving at the home page in mobile viewport, content is offset and a horizontal scroll of a few dozen pixels to the right is available (screenshot shows the whole page framed with a visible right gutter). Continuing to scroll makes the overflow disappear on its own.
- Impact: Mobile layout looks misaligned on first paint and allows sideways panning; a layout shift/overflow source is active during hydration.
- Desired outcome: Home page has no horizontal overflow at any point from first paint through hydration and scrolling in a mobile viewport.
- Tasks: HOME-FIX-01
- Resolution: Fixed by HOME-FIX-01 — see `.autonomos/worklogs/2026-11-16-HOME-FIX-01.md`; verified at 390px viewport with zero document overflow.
