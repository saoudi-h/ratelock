# Worklog — 2026-08-22 — Release prep (branch + commits + docs + changesets)

## What was done

1. Created branch `feat/bun-native-drivers` off main; all session work stacked as 5 conventional commits (husky commitlint + lint-staged passed on each):
   - `chore(agent)`: protocol artifacts (AGENT.mds, TASKS/ISSUES/worklogs), legacy BACKLOG.md + ANALYSIS_REPORT.md deletions
   - `feat(redis)`: bun native driver (client.ts, types.ts, 13 unit tests, README)
   - `fix(postgres)`: sequential duplicate-id batch fallback + regression spec
   - `perf(bench)`: harness variant + scripts + measured report
   - `docs(engines)`: docs-site updates + root README + 2 changesets

2. Documentation audit for the Bun integration — found and fixed a FALSE claim: `getting-started/runtimes.mdx` stated "Bun's native clients are not supported… Bun.redis does not run Lua scripts yet". Now documents first-class support (Lua via raw command API, auto-pipelining, auto-detection, bench reference). Also updated `installation.mdx` (zero-dependency snippet), engine page and root README feature list (done earlier for engine page).

3. Changesets created for the publish flow:
   - `.changeset/bun-native-redis-driver.md` → @ratelock/redis **minor**
   - `.changeset/sequential-duplicate-batch.md` → @ratelock/postgres **patch**

4. Registered [REL-01] in TASKS.md (push + PR + let release.yml drive versioning/publish).

5. Full definition-of-done gates on the branch: build ✓, lint ✓, typecheck ✓, vitest run 102/102 across 18 files.

## Key decisions

- Branch carries the whole session's coherent scope (driver + its fix + evidence + docs); one PR keeps review simple.
- Postgres/Bun.SQL explicitly documented as NOT supported by design (unified-API stance) so the old doc sentence is replaced by an accurate architectural statement instead of just deletion.
- Did NOT push or open the PR: awaiting maintainer go ([REL-01]).

## Files modified

- See the five commits on `feat/bun-native-drivers` (4276bc8..3c540e3 range plus HEAD).

## Next steps for the next session

- [REL-01] `git push -u origin feat/bun-native-drivers`, open PR to main. On merge: release.yml builds+tests, changesets/action opens "Version Packages" PR; merging that PR publishes to npm via NPM_TOKEN.
- VERSIONING CORRECTION (maintainer decision, same day): both changesets downgraded to **patch** — pre-1.0 the second digit is the effective major and must not be bumped lightly. Both packages will publish as **0.2.1**. Policy recorded in root AGENT.md (`chore(agent): adopt patch-first versioning policy pre-1.0`).
- Remaining sprint: [ENV-01] engines >=22 alignment could ride the same release train if desired; [TST-01] integration coverage assessment still open.
