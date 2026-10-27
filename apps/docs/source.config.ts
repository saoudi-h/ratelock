import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { remarkSteps } from 'fumadocs-core/mdx-plugins'
import { defineConfig } from 'fumadocs-mdx/config'
import lastModified from 'fumadocs-mdx/plugins/last-modified'
import { remarkAutoTypeTable } from 'fumadocs-typescript'

const appRoot = path.dirname(fileURLToPath(import.meta.url))

/**
 * Global options shared by every collection of this app. The collections
 * themselves are declared with the macro API in `src/lib/source.ts`.
 *
 * `remarkAutoTypeTable` precomputes every `<AutoTypeTable>` of the MDX
 * content into a static `<TypeTable type={...} />` at compile time. The
 * TanStack build has no RSC layer, so the runtime `AutoTypeTable` of
 * `fumadocs-typescript/ui` cannot render: it needs `ts-morph` and the file
 * system, which do not exist in the browser. The `basePath` is the app root,
 * the same resolution root the Next app used through its working directory.
 */
export default defineConfig({
    plugins: [lastModified()],
    mdxOptions: {
        remarkPlugins: [
            remarkSteps,
            // `remarkAutoTypeTable` returns the transformer itself, so wrap it
            // in an attacher.
            () =>
                remarkAutoTypeTable({
                    name: 'AutoTypeTable',
                    options: { basePath: appRoot },
                }),
        ],
    },
})
