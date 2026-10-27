import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(appRoot, 'content', 'docs')

/**
 * Collects the slugs of every documentation page, so the prerender
 * configuration can list the per-page markdown output paths. A folder with
 * an `index.mdx` is reported by its folder name, a `slug.mdx` by its file
 * stem. Synchronous, because the Vite config loads it at startup.
 */
export function collectDocsPaths(): string[] {
    const paths: string[] = []

    function walk(dir: string, prefix: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('.')) continue

            const relative = prefix ? `${prefix}/${entry.name}` : entry.name
            const full = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                walk(full, relative)
                continue
            }

            if (!entry.name.endsWith('.mdx')) continue

            if (entry.name === 'index.mdx') {
                if (prefix) paths.push(prefix)
            } else {
                paths.push(relative.slice(0, -'.mdx'.length))
            }
        }
    }

    walk(docsRoot, '')
    return paths.sort()
}

export { appRoot }
