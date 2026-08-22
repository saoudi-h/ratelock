---
'@ratelock/postgres': patch
---

Relax the `PgPoolLike` interface so a real `pg.Pool` instance type-checks when passed via the `pool` option — its overloaded `query`/`end` signatures never satisfied the previous narrow structural type.
