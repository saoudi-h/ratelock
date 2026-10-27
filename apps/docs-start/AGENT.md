# AGENT: apps/docs-start

- TanStack Start + Fumadocs port of `apps/docs` (sibling until parity, then `apps/docs` is deleted). Fully prerendered; deployed on Vercel through `nitro()` (Build Output API, preset auto-selected when `VERCEL=1`) so the GitHub feedback server function (`src/lib/github.ts`) has a runtime.
- Content lives in `content/` (copy of `apps/docs/src/content`; keep both in sync until the Next app is removed). Fumadocs uses the macro API in `src/lib/source.ts`; `source.config.ts` holds only global options.
- `remarkAutoTypeTable(...)` returns a transformer, not a plugin: register it as `() => remarkAutoTypeTable(...)`.
- React Compiler: `@vitejs/plugin-react` 6 has no `babel` option; use `@rolldown/plugin-babel` + `reactCompilerPreset()`.
- After every build, check for `Error in render` in the log: prerender can exit 0 while shipping client-only shells.
- Generated, git-ignored: `public/{og,optimized,p.js,r.js}`, `.source`, `.output`, `.vercel`. `VITE_*` vars are baked at build time and silently absent if unset.
- The local node-server preset does not serve prerendered extras (`llms.txt`, `.mdx`); verify those on a Vercel preview, not locally.
