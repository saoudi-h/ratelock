# AGENT: apps/docs

- Next.js 16 App Router + Fumadocs MDX. Content in `src/content/docs/**` with per-folder `meta.json` navs; `.source/` is generated (postinstall `fumadocs-mdx`).
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`; `pnpm typecheck` is the only TS gate.
- Env validated via t3-env (`src/env.ts`): needs `NEXT_PUBLIC_*` + `GITHUB_APP_*` locally (see `.env.example`); validation auto-skips when `CI=true`.
- Deployed on Vercel; build runs from repo root via `turbo run build --filter=@ratelock/docs...`.
- `/docs/:path*.mdx` rewrite exposes LLM-consumable markdown of every page.
- Home animations register GSAP through `(home)/_lib/gsap`; SplitText `autoSplit` callbacks must return their tween or timeline so resplits revert the previous ScrollTrigger.
