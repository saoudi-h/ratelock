---
'@ratelock/postgres': patch
---

Fix `checkBatch` on the sliding window when the identifier list contains duplicates: occurrences now resolve sequentially against accumulated state (matching single-check semantics and other engines) instead of sharing one pre-insert snapshot.
