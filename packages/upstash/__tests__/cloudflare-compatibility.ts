import { Redis } from '@upstash/redis/cloudflare'

import type { UpstashRedisClient } from '../src/types'

// Compile-time guard: provider-specific Upstash clients must remain accepted
// without importing the Node.js entry point into the published declarations.
const cloudflareClient: UpstashRedisClient = new Redis({
    url: 'https://example.com',
    token: 'test',
})

void cloudflareClient
