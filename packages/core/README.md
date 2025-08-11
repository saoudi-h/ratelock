### Ratelock Core (interne)

`@ratelock/core` fournit les briques de base pour construire des limiteurs de débit (rate limiters) fiables et extensibles : contrats/abstractions, système de stratégies typé, limiteur de haut niveau, utilitaires de performance (cache/batch) et de résilience (retry/circuit-breaker).

Important: ce package est publié mais n’est pas destiné aux utilisateurs finaux. Il sert de fondation aux packages adaptateurs (ex: `@ratelock/local`, `@ratelock/redis`) et à ceux qui souhaitent créer leur propre solution.

## Philosophie

- Framework‑agnostic: aucune dépendance à un framework.
- Modularité par adaptateur: chaque stockage (`@ratelock/local`, `@ratelock/redis`, …) possède ses optimisations propres.
- Pas d’interchangeabilité forcée: on évite le plus petit dénominateur commun qui pénaliserait des backends puissants (ex: scripts Lua Redis).
- Stratégies liées au stockage:
    - Les stratégies basiques (opérations simples) vivent dans le core.
    - Les stratégies avancées/optimisées sont fournies par les packages spécifiques (ex: `@ratelock/redis`).
- Contrat d’exports commun: tous les packages doivent exposer les mêmes noms (classes/fonctions/interfaces) pour garantir la cohérence d’API, même si l’implémentation varie.

## Concepts

- **Storage**: contrat unique à implémenter (ex. Redis, mémoire locale) pour persister compteurs et timestamps.
- **Strategy**: logique de limitation (ex. fenêtre fixe). Builder/Registry pour composer et typer les résultats.
- **Limiter**: façade simple `check(identifier)` avec politique d’erreur.
- **Performance**: `L1Cache`, `CachedStorage`, `BatchProcessor`, `LazyTimestampCleaner` (activables via options du `RateLimiter`).
- **Résilience**: `RetryService`, `CircuitBreaker` (activables via options du `RateLimiter`).

## Utilisation

- Utilisateurs finaux: installer un package adaptateur (ex: `@ratelock/redis`) et utiliser ses exports (qui réexportent le contrat commun).
- Auteurs d’adaptateurs: utiliser `@ratelock/core` pour implémenter le stockage/stratégies et réexporter la même surface d’API.

### Exemple (auteur d’adaptateur)

```ts
import { FixedWindow, RateLimiter, type Storage } from '@ratelock/core'

// Adapter Storage (à fournir via @ratelock/local, @ratelock/redis, etc.)
const storage: Storage = /* votre implémentation */ null as any

// Stratégie : 100 requêtes / 60s
const limiter = new RateLimiter({
    strategyFactory: s => FixedWindow({ limit: 100, windowMs: 60_000 }).withStorage(s),
    storage,
    prefix: 'api',
})

const res = await limiter.check('user:42')
if (!res.allowed) {
    // res.remaining, res.reset (timestamp ms de fin de fenêtre)
}
```

### Options avancées (performance & résilience)

```ts
import { RateLimiter, FixedWindow, type Storage } from '@ratelock/core'

const storage: Storage = /* votre implémentation */ null as any

const limiter = new RateLimiter({
    strategyFactory: s => FixedWindow({ limit: 100, windowMs: 60_000 }).withStorage(s),
    storage,
    performance: {
        cache: { enabled: true, maxSize: 5_000, ttlMs: 5_000, cleanupIntervalMs: 1_000 },
        lazyCleanup: {
            maxQueueSize: 1_000,
            cleanupBatchSize: 50,
            cleanupIntervalMs: 50,
            priorityThreshold: 1,
        },
    },
    resilience: {
        retryConfig: {
            maxAttempts: 3,
            baseDelayMs: 10,
            maxDelayMs: 100,
            backoffMultiplier: 2,
            retryableErrors: [/timeout/],
            jitter: true,
        },
        circuitBreakerConfig: {
            failureThreshold: 5,
            recoveryTimeoutMs: 5_000,
            monitoringWindowMs: 60_000,
            minimumRequestsForStats: 20,
        },
    },
})
```

## Export principaux

- `Storage`, `StoragePipeline`
- `Strategy`, `FixedWindow`, `IndividualFixedWindow`, `SlidingWindowBuilder`, `TokenBucket`, builder/registry
- `RateLimiter`
- `L1Cache`, `CachedStorage`, `BatchProcessor`, `LazyTimestampCleaner`
- `RetryService`, `CircuitBreaker`

Ce package est interne et sert de fondation aux packages publiés (adapters, intégrations framework).
