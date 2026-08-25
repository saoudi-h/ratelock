import { AltArrowLeftIcon, AltArrowRightIcon } from '@solar-icons/react/linear'
import { InlineTOC } from 'fumadocs-ui/components/inline-toc'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { createMetadata } from '@/lib/metadata'
import { blogSource } from '@/lib/source'
import { cn } from '@/lib/utils'
import { getMDXComponents } from '@/mdx-components'

import { BentoBase } from '../../components/bento-base'
import { BlogPostShell } from '../components/blog-post-shell'
import { PostCover } from '../components/post-cover'
import { ShareButton } from '../components/share-button'
import { TagPill } from '../components/tag-pill'

function isDraft(page: ReturnType<typeof blogSource.getPages>[number]) {
    return (page.data.status as string | undefined) === 'draft'
}

function isVisible(page: ReturnType<typeof blogSource.getPages>[number]) {
    return !isDraft(page) || process.env.NODE_ENV !== 'production'
}

function formatDate(value: Date | string) {
    const d = value instanceof Date ? value : new Date(value)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params
    const page = blogSource.getPage([params.slug])
    if (!page || !isVisible(page)) notFound()

    const MDX = page.data.body
    const toc = page.data.toc
    const tags = (page.data.tags as string[] | undefined) ?? []

    const related = [...blogSource.getPages()]
        .filter(p => isVisible(p) && p.url !== page.url)
        .sort((a, b) => {
            const da =
                a.data.date instanceof Date
                    ? a.data.date.getTime()
                    : new Date(a.data.date as string).getTime()
            const db =
                b.data.date instanceof Date
                    ? b.data.date.getTime()
                    : new Date(b.data.date as string).getTime()
            return db - da
        })
        .slice(0, 2)

    return (
        <BlogPostShell>
            <div className="mx-auto w-full max-w-3xl px-6 py-10">
                <Link
                    href="/blog"
                    className="
                      inline-flex items-center gap-1 text-sm font-medium text-muted-foreground
                      transition-colors hover:text-foreground
                    ">
                    <AltArrowLeftIcon className="size-4" /> Back to blog
                </Link>

                {isDraft(page) && (
                    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
                        Draft — this post is only visible in development. Set{' '}
                        <code className="rounded bg-amber-500/20 px-1 py-0.5">
                            status: published
                        </code>{' '}
                        to publish it.
                    </div>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-2">
                    {tags.map(t => (
                        <TagPill key={t} label={t} />
                    ))}
                </div>

                <h1
                    data-post-title
                    className="font-heading mt-4 text-4xl leading-tight font-bold tracking-tight md:text-[40px]">
                    {page.data.title}
                </h1>
                <p data-post-desc className="mt-3 text-base/relaxed text-muted-foreground">
                    {page.data.description}
                </p>

                <div
                    data-post-meta
                    className="
                      mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border/40
                      bg-card/60 p-1 shadow-xs
                    ">
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {(page.data.author as string).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                                {page.data.author as string}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatDate(page.data.date as Date)}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-1 p-1">
                        <ShareButton url={page.url} />
                        <Link
                            href="/docs"
                            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                            Docs <AltArrowRightIcon className="size-4" />
                        </Link>
                    </div>
                </div>

                <PostCover
                    post={
                        page as unknown as {
                            slugs: string[]
                            data: { title: string; image?: string }
                        }
                    }
                    sizes="(min-width: 768px) 672px, 100vw"
                    priority
                    className="mt-8 aspect-video rounded-3xl border border-border/40 shadow-xs"
                />

                <div data-post-body className="prose mt-8 max-w-none">
                    <InlineTOC items={toc} />
                    <MDX components={getMDXComponents()} />
                </div>

                <div className="mt-10 flex flex-wrap gap-2">
                    <Link
                        href="/blog"
                        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                        <AltArrowLeftIcon className="size-4" /> More articles
                    </Link>
                    <Link
                        href="/docs"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        Read docs <AltArrowRightIcon className="size-4" />
                    </Link>
                </div>

                {related.length > 0 && (
                    <div className="mt-12">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                            <span className="h-px w-6 bg-primary" aria-hidden />
                            Keep reading
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {related.map(p => (
                                <Link
                                    key={p.url}
                                    href={p.url}
                                    className="block h-full outline-none">
                                    <BentoBase density="compact" className="h-full">
                                        <div className="flex h-full min-h-40 flex-col justify-between gap-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="pt-0.5 text-xs font-medium text-muted-foreground">
                                                    {new Date(
                                                        p.data.date as Date
                                                    ).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <TagPill
                                                    label={
                                                        (
                                                            p.data.tags as string[] | undefined
                                                        )?.[0] ?? 'article'
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <div className="font-heading text-lg font-bold tracking-tight text-foreground group-hover:text-primary">
                                                    {p.data.title}
                                                </div>
                                                <div className="mt-1 line-clamp-2 text-sm/relaxed text-muted-foreground">
                                                    {p.data.description}
                                                </div>
                                                <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                                                    Read article{' '}
                                                    <AltArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </BentoBase>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </BlogPostShell>
    )
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const params = await props.params
    const page = blogSource.getPage([params.slug])
    if (!page || !isVisible(page)) notFound()
    return createMetadata({
        title: page.data.title,
        description: page.data.description ?? `RateLock blog — ${page.data.title}`,
        openGraph: { url: page.url },
    })
}

export function generateStaticParams(): { slug: string }[] {
    return blogSource
        .getPages()
        .filter(isVisible)
        .map(page => ({ slug: page.slugs[0] ?? '' }))
}
