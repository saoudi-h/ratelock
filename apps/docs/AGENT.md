# AGENT: apps/docs

- TanStack Start + Fumadocs (macro API in `src/lib/source.ts`; `source.config.ts` holds only global options). Fully prerendered; deployed on Vercel through `nitro()` (Build Output API, preset auto-selected when `VERCEL=1`) so the GitHub feedback server function (`src/lib/github.ts`) has a runtime. Vercel project `ratelock-docs-start`, root dir `apps/docs`, serves `ratelock-docs.vercel.app`.
- Content: docs in `content/docs/**` with per-folder `meta.json` navs; blog in `content/blog/*.mdx` (flat) with frontmatter `title, description, author, date, tags?, image?`. `.source/` is generated.
- Env (build-time `VITE_*`, silently absent if unset): `VITE_SITE_URL`, `VITE_UMAMI_ID`, `VITE_UMAMI_URL`; runtime secrets `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` (Docs Feedback discussions category must exist; the app needs Discussions read/write). See `.env.example`.
- `remarkAutoTypeTable(...)` returns a transformer, not a plugin: register it as `() => remarkAutoTypeTable(...)`.
- React Compiler: `@vitejs/plugin-react` 6 has no `babel` option; use `@rolldown/plugin-babel` + `reactCompilerPreset()`.
- `createRelativeLink` from `fumadocs-ui/mdx` is a stub in the browser (breaks hydration); use `createRelativeLink` from `~/components/framework-link`.
- After every build, check for `Error in render` in the log: prerender can exit 0 while shipping client-only shells. Test hydration in a real browser, not only with curl.
- Generated, git-ignored: `public/{og,optimized,p.js,r.js}`, `.source`, `.output`, `.vercel`.
- The local node-server preset does not serve prerendered extras (`llms.txt`, `.mdx`); verify those on a Vercel preview.
- Vercel skips a deployment when a commit does not touch the project root dir.
- Home page performance (Lighthouse mobile ~90): the hero entrances (`.hero-animate` in `app.css`) are CSS keyframes, never GSAP `fromTo`: each `fromTo` forced a style recalculation during hydration. Use `backwards` fill so scroll-driven GSAP tweens can own the transform afterwards. Never hide LCP text behind JS (`gsap-prep`, inline `opacity: 0`).
- Sections below the fold are wrapped with `lazyWhenIdle` (`components/home/_lib`): prerendered HTML stays, hydration waits for the first interaction. Their Iconify icons ship in `src/generated/icons-deferred.ts`.
- Iconify icons are bundled, not fetched from api.iconify.design: after adding or renaming an icon id (`prefix:name`), run `pnpm generate:icons` and commit `src/generated/*` (prefix needs an `@iconify-json/<prefix>` devDependency and an entry in `scripts/generate-icons.ts`).
- Measure on a Vercel preview (`lighthouse --extra-headers` with a protection-bypass secret), not on a local static server: without compression the simulated LCP is far worse than production. Profile hydration with puppeteer-core + CDP `Profiler` on an unminified build.
