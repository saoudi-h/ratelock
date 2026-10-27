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
