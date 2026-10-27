import { loader } from 'fumadocs-core/source'
import { pageSchema } from 'fumadocs-core/source/schema'
import { defineCollections, defineDocs } from 'fumadocs-mdx/macro'
import { z } from 'zod'

/**
 * The collections read the MDX files of the `content` folder.
 *
 * `async: true` keeps the frontmatter in the client bundle and splits every
 * page body into its own chunk, loaded on demand.
 */
export const docs = defineDocs({
    dir: './content/docs',
    docs: {
        schema: pageSchema.extend({
            preview: z.string().optional(),
            index: z.boolean().default(false),
            /**
             * API routes only
             */
            method: z.string().optional(),
        }),
        async: true,
        lastModified: true,
        postprocess: {
            includeProcessedMarkdown: true,
            extractLinkReferences: true,
            valueToExport: ['elementIds'],
        },
    },
})

export const blog = defineCollections({
    dir: './content/blog',
    type: 'doc',
    async: true,
    schema: pageSchema.extend({
        author: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
        /**
         * Marks an article as featured on /blog. When several articles are
         * marked, the most recent by date wins.
         */
        featured: z.boolean().default(false),
        /**
         * Publication status. Only `published` articles are listed and
         * statically generated. Use `draft` to keep an article unpublished.
         * Defaults to `published` for backward-compatibility.
         */
        status: z.enum(['draft', 'published']).default('published'),
    }),
    postprocess: {
        includeProcessedMarkdown: true,
        extractLinkReferences: true,
    },
})

export const source = loader({
    baseUrl: '/docs',
    source: docs.toFumadocsSource(),
})

export const blogSource = loader({
    baseUrl: '/blog',
    source: blog.toFumadocsSource(),
})
