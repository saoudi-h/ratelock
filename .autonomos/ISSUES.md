# PROJECT ISSUES

> Intake for problems, proposals, and questions awaiting triage. Describe evidence, impact, and desired outcome — no implementation choices. Accepted issues get a linked task in `.autonomos/TASKS.md`.

## [ISSUE-001] Establish a searchable editorial surface for RateLock

- Type: proposal
- Status: resolved
- Evidence: RateLock has a technically rich strategy simulator, multiple storage engines, resilience policies, and framework integrations, but no durable editorial surface focused on the questions developers search before adopting a rate limiter. Organic discovery is currently very limited, and future articles or announcements need a canonical source that can be revisited and distributed through external channels over time. Fumadocs now provides blog-oriented primitives that may reduce the cost of establishing this surface, but the implementation approach remains open.
- Impact: Developers who could benefit from RateLock have few paths to discover it through search or framework-specific learning resources. The project also lacks a consistent place to publish durable explanations, connect them to the documentation, playground, and packages, and measure whether editorial work creates qualified visits and adoption.
- Desired outcome: RateLock has an owned, maintainable, searchable editorial surface with clear article metadata, durable URLs, useful navigation and internal linking, references to relevant documentation and interactive proof, and a lightweight publishing workflow suitable for occasional high-quality articles and later distribution to social and community channels.
- Tasks: BLOG-01, BLOG-02
