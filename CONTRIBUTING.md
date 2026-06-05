# Contributing to RateLock

Thank you for your interest in contributing! We welcome all kinds of contributions — bug reports, feature requests, documentation improvements, and code.

## Getting Started

### Prerequisites

- **Node.js >= 22** or **Bun >= 1.1** (CI runs on both; see the [Runtimes page](https://github.com/saoudi-h/ratelock/blob/main/apps/docs/src/content/docs/getting-started/runtimes.mdx))
- **pnpm >= 10** (this project uses pnpm as its package manager)
- **Docker** (for running integration tests)

### Setup

```bash
# Clone the repository
git clone https://github.com/saoudi-h/ratelock.git
cd ratelock

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
ratelock/
├── packages/
│   ├── core/          # Shared types, decorators, and utilities
│   ├── local/         # In-memory adapter
│   ├── redis/         # Redis adapter
│   ├── postgres/      # PostgreSQL adapter
│   ├── bench/         # Benchmarking suite
│   ├── test-utils/    # Shared test contracts (internal)
│   └── vitest/        # Vitest project config (internal)
├── apps/
│   ├── docs/          # Documentation site (Next.js + Fumadocs)
│   └── playground/    # Interactive demo app (Next.js)
```

## Development Workflow

### Running a Single Package

```bash
# Watch mode for a specific package
cd packages/redis
pnpm dev

# Run tests for a specific package
cd packages/local
pnpm test
```

### Running the Full Suite

```bash
# Build everything
pnpm build

# Lint everything
pnpm lint

# Type-check everything
pnpm typecheck

# Run all tests
pnpm test
```

### Integration Tests

Packages with external dependencies (Redis, PostgreSQL) require Docker:

```bash
# Run integration tests for Redis
cd packages/redis
pnpm test:integration

# Run integration tests for PostgreSQL
cd packages/postgres
pnpm test:integration
```

### Running Tests on Bun

Mock test suites run on both Node.js and Bun. Integration tests stay on Node.js because the harness uses test containers, and Bun's compatibility layer is not exercised by the package code.

```bash
# Use the system Bun to run the test command
bun --version

# Run the full mock suite on Bun
pnpm test

# Run a single package on Bun
cd packages/redis
bun run test
```

If a test passes on Node and fails on Bun, it is a real bug, not a flake. Open an issue with the failing output and the Bun version.

## Pull Requests

1. **Fork** the repository and create your branch from `main`.
2. **Make your changes** — follow the existing code style.
3. **Add tests** if you're adding or changing functionality.
4. **Ensure everything passes**: `pnpm build && pnpm lint && pnpm typecheck && pnpm test`
5. **Submit a pull request** with a clear description of the changes.

### Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add sliding window support for PostgreSQL
fix: correct windowStart calculation in Redis adapter
docs: update README with new usage examples
test: add integration tests for token bucket
chore: update dependencies
```

### Changesets

For user-facing changes, include a changeset:

```bash
pnpm changeset
```

Follow the prompts to describe your change. This ensures proper versioning and changelog generation.

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **Formatting** — handled by Prettier (run `pnpm format:fix`)
- **Linting** — ESLint with `@tala-tools/eslint` (run `pnpm lint:fix`)
- **No comments in code** unless explaining non-obvious behavior

## Reporting Bugs

When filing a bug, please include:

1. Package name and version
2. Runtime and version (Node.js or Bun)
3. A minimal reproduction (code snippet or repository)
4. Expected vs. actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
