import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import {
    DocsPage,
    MarkdownCopyButton,
    PageLastUpdate,
    ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page'
import { use } from 'react'

import { DocsRate } from '~/components/docs-rate'
import { FrameworkLink } from '~/components/framework-link'
import { useMDXComponents } from '~/components/mdx-components'
import { docsOptions } from '~/lib/layout-options'
import { source } from '~/lib/source'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/docs/$')({
    loader: async ({ params }) => {
        const slugs = params._splat?.split('/').filter(Boolean) ?? []
        const page = source.getPage(slugs)
        if (!page) throw notFound()

        await page.data.preload()

        return { slugs }
    },
    head: ({ loaderData }) => {
        const page = loaderData ? source.getPage(loaderData.slugs) : undefined
        if (!page) return {}

        return seo({
            title: page.data.title,
            description: page.data.description ?? '',
            path: `/docs/${page.slugs.join('/')}`,
            image: `/og/${page.slugs.join('/')}/image.png`,
        })
    },
    component: DocsRoute,
})

function DocsRoute() {
    const { slugs } = Route.useLoaderData()
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    const { toc, lastModified } = use(page.data.load())
    const MDXContent = page.data.body
    const markdownUrl = `/docs/${page.slugs.join('/')}.mdx`

    return (
        <DocsLayout tree={source.pageTree} {...docsOptions}>
            <DocsPage toc={toc} full={page.data.full}>
                <DocsTitle>{page.data.title}</DocsTitle>
                <DocsDescription>{page.data.description}</DocsDescription>
                <div className="flex flex-row flex-wrap items-center gap-2 border-b pb-6">
                    <MarkdownCopyButton markdownUrl={markdownUrl} />
                    <ViewOptionsPopover
                        markdownUrl={markdownUrl}
                        githubUrl={`https://github.com/saoudi-h/ratelock/blob/main/apps/docs/src/content/docs/${page.path}`}
                    />
                </div>
                <DocsBody>
                    <MDXContent
                        components={useMDXComponents({
                            a: createRelativeLink(source, page, FrameworkLink),
                        })}
                    />
                </DocsBody>
                <DocsRate />
                {lastModified ? <PageLastUpdate date={lastModified} /> : null}
            </DocsPage>
        </DocsLayout>
    )
}
