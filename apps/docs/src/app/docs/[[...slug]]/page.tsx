import { Rate } from '@/components/ui-blocks/rate'
import { onRateAction } from '@/lib/github'
import { source } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'
import {
    DocsPage,
    MarkdownCopyButton,
    PageLastUpdate,
    ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) notFound()

    const MDXContent = page.data.body
    const markdownUrl = `${page.url}.mdx`

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
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
                    components={getMDXComponents({
                        a: createRelativeLink(source, page),
                    })}
                />
            </DocsBody>
            <Rate onRateAction={onRateAction} />
            {page.data.lastModified && <PageLastUpdate date={page.data.lastModified} />}
        </DocsPage>
    )
}

export async function generateStaticParams() {
    return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) return {}

    return {
        title: page.data.title,
        description: page.data.description,
    }
}
