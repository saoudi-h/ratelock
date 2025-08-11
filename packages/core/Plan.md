# Plan de développement - @ratelock/core

## Philosophie globale

- **Framework agnostic**: Le rateLimiter doit être indépendant de tout framework
- **Modularité via des packages dédiés**: Le stockage sera géré par des packages spécifiques (ex: @ratelock/local, @ratelock/redis, etc.)
- **Rôle du core**: Centraliser tout ce qui est commun à tous les packages : interfaces, classes de base, etc.
- **Cohérence des signatures**: Chaque package doit exporter les mêmes fonctions, classes et interfaces avec les mêmes noms
- **Pas d'interchangeabilité des stockages**: Chaque solution de stockage a ses spécificités, on évite l'approche "one-size-fits-all"
- **Stratégies liées au stockage**: Les stratégies basiques dans le core, les avancées dans les packages spécifiques

## ✅ Ce qui est bien fait

### Architecture

- **Découpage par responsabilité**: `abstract.ts`, `types.ts`, `registry.ts`, `builder.ts`, `factory.ts`
- **Stratégies modulaires**: Un dossier par stratégie (`fixed-window/`, `individual-fixed-window/`, `sliding-window/`, `token-bucket/`)
- **API unifiée**: `RateLimiter` unique avec options de performance et résilience
- **Typage strict**: Suppression des `any`, interfaces bien définies

### Stratégies v1.0.0 ✅

1. **FixedWindow**: Fenêtres temporelles fixes à intervalles réguliers
2. **IndividualFixedWindow**: Fenêtres qui commencent à la première requête de l'utilisateur
3. **SlidingWindow**: Fenêtres glissantes basées sur des timestamps
4. **TokenBucket**: Algorithme de seau de jetons avec remplissage progressif

### Performance

- **L1Cache**: Cache LRU avec TTL
- **BatchProcessor**: Traitement par lots
- **CachedStorage**: Wrapper avec cache et batch
- **LazyTimestampCleaner**: Nettoyage asynchrone des timestamps

### Résilience

- **RetryService**: Retry avec backoff exponentiel et jitter
- **CircuitBreaker**: Pattern circuit breaker pour éviter les cascades d'échecs

### Tests ✅

- **51 tests passants**: Couverture complète des stratégies et fonctionnalités
- **Tests d'intégration**: Contrat Storage
- **Tests unitaires**: Chaque composant testé individuellement
- **Tests des nouvelles stratégies**: IndividualFixedWindow, SlidingWindow, TokenBucket
- **Documentation en anglais**: Tous les tests et commentaires traduits
- **Corrections TypeScript**: Toutes les erreurs de typage corrigées
- **Classe de test commune**: InMemoryStorage partagée entre tous les tests

## 🔄 Points à améliorer / à refaire

### Court terme

- **Documentation**: Exemples d'utilisation pour chaque stratégie
- **Validation**: Tests de performance et de charge
- **Monitoring**: Métriques et analytics

### Moyen terme

- **Optimisations**: Profiling et optimisation des stratégies
- **Nouvelles stratégies**: Stratégies avancées dans les packages spécifiques
- **Intégrations**: Packages @ratelock/local et @ratelock/redis

## 📋 Backlog court terme

### Priorité haute

- [ ] **Packages de stockage**: Implémenter @ratelock/local et @ratelock/redis
- [ ] **Benchmarks**: Tests de performance comparatifs
- [ ] **Documentation**: Guide d'utilisation complet

### Priorité moyenne

- [ ] **Analytics**: Système de métriques et monitoring
- [ ] **CLI**: Outil de ligne de commande pour les tests
- [ ] **Plugins**: Système d'extensions

### Priorité basse

- [ ] **Exemples**: Plus d'exemples d'intégration
- [ ] **Migration**: Guide de migration depuis d'autres librairies

## 🎯 Objectifs v1.0.0

### ✅ Complétés

- [x] 4 stratégies de base (FixedWindow, IndividualFixedWindow, SlidingWindow, TokenBucket)
- [x] Architecture modulaire et extensible
- [x] Performance et résilience intégrées
- [x] Tests complets (51 tests passants)
- [x] Documentation de base
- [x] Traduction en anglais de tous les tests

### 🔄 En cours

- [ ] Packages de stockage (@ratelock/local, @ratelock/redis)
- [ ] Optimisations de performance
- [ ] Système d'analytics

### 📅 Planifié

- [ ] Stratégies avancées (Redis Lua scripts, etc.)
- [ ] Intégrations framework
- [ ] Outils de monitoring

## 📊 Métriques actuelles

- **Tests**: 51/51 passants
- **Stratégies**: 4/4 implémentées et testées
- **Couverture**: 100% des fonctionnalités de base
- **Performance**: Cache L1, batch processing, lazy cleanup
- **Résilience**: Retry, circuit breaker
- **Documentation**: Tests et commentaires en anglais
- **Qualité du code**: TypeScript strict sans erreurs

## 🎉 État actuel

Le package core est maintenant **stable et prêt pour la v1.0.0** avec :

1. **4 stratégies complètes** avec tests exhaustifs
2. **Architecture modulaire** bien structurée
3. **API unifiée** avec options de performance et résilience
4. **Tests complets** (51 tests passants)
5. **Documentation en anglais** pour l'internationalisation

Les prochaines étapes sont l'implémentation des packages de stockage (@ratelock/local, @ratelock/redis) et les optimisations de performance.
