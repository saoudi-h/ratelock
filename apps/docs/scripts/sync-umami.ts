/**
 * Copies the Umami scripts to `public/` so they are served from our own
 * origin, exactly like the `/p.js` and `/r.js` routes of the Next app, but
 * without a runtime proxy. On Vercel those routes would cost a serverless
 * invocation per visit; a static file costs nothing.
 *
 * `loader.js` becomes `/p.js` (page views) and `recorder.js` becomes `/r.js`
 * (session replay).
 *
 * The scripts are build artifacts: they are not committed.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const umamiUrl = process.env.VITE_UMAMI_URL ?? ''

if (!umamiUrl) {
    console.log('Umami is not configured (VITE_UMAMI_URL), skipping /p.js and /r.js.')
    process.exit(0)
}

const scripts = [
    { remote: '/loader.js', local: 'p.js' },
    { remote: '/recorder.js', local: 'r.js' },
]

for (const { remote, local } of scripts) {
    const outputFile = path.join(appRoot, 'public', local)

    try {
        const response = await fetch(new URL(remote, umamiUrl), {
            headers: { Accept: 'application/javascript, text/javascript;q=0.9' },
            redirect: 'error',
        })

        if (!response.ok) {
            throw new Error(`Umami responded with ${response.status}`)
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (contentType.includes('text/html')) {
            throw new Error('Umami returned HTML instead of a script')
        }

        await mkdir(path.dirname(outputFile), { recursive: true })
        await writeFile(outputFile, await response.text())
        console.log(`Wrote ${local} from ${umamiUrl}${remote}.`)
    } catch (error) {
        // Analytics must never fail the deploy: a stale or missing script
        // only means fewer measurements.
        console.warn(`Could not fetch ${remote}: ${error instanceof Error ? error.message : error}`)
    }
}
