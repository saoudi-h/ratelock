import path from 'node:path'
import { fileURLToPath } from 'node:url'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fumadocsMdx } from 'fumadocs-mdx/vite'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

import { collectDocsPaths } from './scripts/docs-paths'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const srcDir = path.join(appRoot, 'src')

const docsPaths = collectDocsPaths()

const staticPages = [
    { path: '/404', prerender: { enabled: true, outputPath: '/404.html' } },
    { path: '/llms-txt', prerender: { enabled: true, outputPath: '/llms.txt' } },
    { path: '/llms-full-txt', prerender: { enabled: true, outputPath: '/llms-full.txt' } },
    { path: '/sitemap-xml', prerender: { enabled: true, outputPath: '/sitemap.xml' } },
    { path: '/blog-rss-xml', prerender: { enabled: true, outputPath: '/blog/rss.xml' } },
    { path: '/api-search', prerender: { enabled: true, outputPath: '/api/search' } },
    ...docsPaths.map(docsPath => ({
        path: `/llms-page/docs/${docsPath}`,
        prerender: { enabled: true, outputPath: `/docs/${docsPath}.mdx` },
    })),
]

export default defineConfig({
    server: {
        port: 3001,
    },
    resolve: {
        tsconfigPaths: true,
        // The Next app and this app depend on the same Fumadocs packages. pnpm
        // can install them twice because their optional peers differ; two
        // copies mean two React contexts and every Fumadocs link would fall
        // back to a plain anchor with a full page load.
        dedupe: ['fumadocs-core', 'fumadocs-ui', 'fumadocs-mdx', 'react', 'react-dom'],
        alias: [
            // MDX content imports components through `~/`.
            { find: /^~\//, replacement: `${srcDir}/` },
        ],
    },
    ssr: {
        // The AutoTypeTable generator runs these at build/render time; they
        // are CommonJS and break the ESM server bundle with `__filename is
        // not defined` when they get inlined. Same list as the Next app's
        // `serverExternalPackages`.
        external: ['ts-morph', 'typescript', 'oxc-transform', 'twoslash', 'shiki'],
    },
    plugins: [
        tailwindcss(),
        fumadocsMdx(),
        tanstackStart({
            prerender: {
                enabled: true,
                crawlLinks: true,
                autoSubfolderIndex: false,
                failOnError: true,
                // Anchors and query strings do not change the static output.
                // `/LICENSE` is a repo file the docs content links to; the
                // Next app served a 404 for it, so it is not a page here
                // either.
                filter: ({ path }) => !/[#?]|%23|%3F/i.test(path) && path !== '/LICENSE',
                onSuccess: ({ page }) => {
                    console.log(`Prerendered ${page.path}`)
                },
            },
            pages: staticPages,
        }),
        // Vercel output (Build Output API): static prerendered pages plus one
        // function for the feedback server function. Nitro auto-detects Vercel.
        nitro(),
        viteReact(),
        babel({ presets: [reactCompilerPreset()] }),
    ],
})
