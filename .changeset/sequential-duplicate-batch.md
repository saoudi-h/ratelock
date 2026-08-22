---
'@ratelock/postgres': patch
---

Fix nondeterministic results for `checkBatch` calls containing duplicate identifiers: the fallback now runs individual checks sequentially instead of concurrently, so each result position reflects single-check semantics regardless of driver or connection timing.
