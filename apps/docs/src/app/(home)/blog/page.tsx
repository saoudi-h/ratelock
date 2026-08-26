import { AltArrowRightIcon } from '@solar-icons/react/bold-duotone'
import type { Metadata } from 'next'
import Link from 'next/link'

import { blogSource } from '@/lib/source'

import { BentoBase } from '../components/bento-base'
import { BlogShell } from './blog-shell'
import { PostCover } from './components/post-cover'
import { TagPill } from './components/tag-pill'

type BlogPost = ReturnType<typeof blogSource.getPages>[number]

export const metadata: Metadata = {
    title: 'Blog',
    description:
        'Articles on rate limiting. Integrations, strategies, and resilience notes from the RateLock project.',
    openGraph: { siteName: 'RateLock' },
    twitter: { card: 'summary_large_image' },
}

function formatDate(value: Date | string) {
    const d = value instanceof Date ? value : new Date(value)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function isDraft(page: BlogPost) {
    return (page.data.status as string | undefined) === 'draft'
}

function isVisible(page: BlogPost) {
    return !isDraft(page) || process.env.NODE_ENV !== 'production'
}

export default async function BlogPage(props: { searchParams: Promise<{ tag?: string }> }) {
    const { tag } = await props.searchParams
    const allPosts = [...blogSource.getPages()].filter(isVisible).sort((a, b) => {
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

    const activeTag = tag?.toLowerCase()
    const filtered = activeTag
        ? allPosts.filter(p =>
              (p.data.tags as string[] | undefined)?.some(t => t.toLowerCase() === activeTag)
          )
        : allPosts

    // Declarative: frontmatter `featured: true` opts an article in. When
    // several are marked, allPosts is date-desc so the first one wins.
    const featured =
        !activeTag && filtered.length > 0 ? (filtered.find(p => p.data.featured) ?? null) : null
    const rest = featured ? filtered.filter(p => p !== featured) : filtered

    const allTags = Array.from(
        new Set(allPosts.flatMap(p => (p.data.tags as string[] | undefined) ?? []))
    ).sort()

    return (
        <BlogShell layoutKey={activeTag ?? ''}>
            <main className="mx-auto w-full max-w-6xl px-6 py-10">
                <div className="max-w-3xl">
                    <h1
                        data-blog-hero-title
                        className="font-heading text-4xl font-semibold md:text-5xl">
                        Blog
                    </h1>
                    <p
                        data-blog-hero-desc
                        className="mt-3 max-w-2xl text-base text-muted-foreground">
                        Notes on shipping rate limiting in real apps. Framework integrations,
                        strategy comparisons, and how we handle failure modes. Short, practical,
                        with code.
                    </p>
                    <div
                        data-blog-hero-meta
                        className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{allPosts.length} articles</span>
                        <span className="text-border">|</span>
                        <Link
                            href="/blog/rss.xml"
                            className="underline underline-offset-4 hover:text-foreground">
                            RSS
                        </Link>
                        <span className="text-border">|</span>
                        <Link
                            href="/docs"
                            className="underline underline-offset-4 hover:text-foreground">
                            Docs
                        </Link>
                    </div>
                </div>

                <div
                    data-blog-filter
                    className="mt-8 flex flex-wrap gap-2 border-y border-border py-4">
                    <Link
                        href="/blog"
                        className={`rounded-full border px-3 py-1 text-sm ${
                            !activeTag
                                ? `
                          border-foreground bg-foreground text-background
                        `
                                : `
                          border-border
                          hover:bg-muted
                        `
                        }`}>
                        All
                    </Link>
                    {allTags.map(t => (
                        <Link
                            key={t}
                            href={`/blog?tag=${encodeURIComponent(t)}`}
                            className={`rounded-full border px-3 py-1 text-sm ${
                                activeTag === t.toLowerCase()
                                    ? `
                              border-foreground bg-foreground text-background
                            `
                                    : `
                              border-border
                              hover:bg-muted
                            `
                            }`}>
                            {t}
                        </Link>
                    ))}
                    {activeTag && (
                        <Link
                            href="/blog"
                            className="
                              ml-2 text-sm text-muted-foreground underline underline-offset-4
                              hover:text-foreground
                            ">
                            Clear
                        </Link>
                    )}
                </div>

                {featured && (
                    <Link
                        data-blog-featured
                        href={featured.url}
                        className="group mt-6 block h-full outline-none">
                        <BentoBase wrapperClassName="focus-within:ring-2 focus-within:ring-primary/50">
                            <div className="grid items-center gap-8 md:grid-cols-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {formatDate(featured.data.date as Date)}
                                        </span>
                                        <TagPill
                                            label={
                                                (featured.data.tags as string[] | undefined)?.[0] ??
                                                'article'
                                            }
                                        />
                                        {isDraft(featured) && (
                                            <span
                                                className="
                                              inline-flex items-center rounded-full border
                                              border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5
                                              text-xs font-semibold text-amber-700
                                              dark:text-amber-300
                                            ">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    <h2
                                        className="
                                          mt-4 font-heading text-2xl font-bold tracking-tight
                                          text-foreground
                                          group-hover:text-primary
                                          md:text-3xl
                                        ">
                                        {featured.data.title}
                                    </h2>
                                    <p className="mt-2 text-sm/relaxed text-muted-foreground">
                                        {featured.data.description}
                                    </p>
                                    <div
                                        className="
                                      mt-5 inline-flex items-center gap-1.5 text-sm font-semibold
                                      text-primary
                                    ">
                                        Read article
                                        <AltArrowRightIcon
                                            className="
                                          size-4 transition-transform
                                          group-hover:translate-x-0.5
                                        "
                                        />
                                    </div>
                                </div>

                                <PostCover
                                    post={featured}
                                    sizes="(min-width: 768px) 50vw, 100vw"
                                    priority
                                    className="
                                      aspect-video rounded-3xl border border-border/40 shadow-xs
                                    "
                                />
                            </div>
                        </BentoBase>
                    </Link>
                )}

                <div className="mt-8">
                    {filtered.length === 0 ? (
                        <div
                            className="
                          rounded-4xl border border-dashed border-border p-10 text-center
                        ">
                            <p className="text-sm font-medium">
                                {activeTag ? `No articles for “${activeTag}”.` : 'No articles yet.'}
                            </p>
                            {activeTag && (
                                <Link
                                    href="/blog"
                                    className="
                                      mt-2 inline-flex text-sm text-muted-foreground underline
                                      underline-offset-4
                                      hover:text-foreground
                                    ">
                                    Show all
                                </Link>
                            )}
                        </div>
                    ) : rest.length > 0 ? (
                        <div
                            data-blog-grid
                            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {rest.map(post => (
                                <Link
                                    key={post.url}
                                    href={post.url}
                                    data-blog-card
                                    className="block h-full outline-none">
                                    <BentoBase className="h-full" density="compact">
                                        <div className="flex h-full flex-col gap-3">
                                            <PostCover
                                                post={post}
                                                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                                className="
                                                  aspect-video rounded-xl border border-border/40
                                                "
                                            />
                                            <div
                                                className="
                                              flex flex-wrap items-center justify-between gap-2
                                            ">
                                                <span
                                                    className="
                                                  text-xs font-medium text-muted-foreground
                                                ">
                                                    {formatDate(post.data.date as Date)}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    {isDraft(post) && (
                                                        <span
                                                            className="
                                                          inline-flex items-center rounded-full
                                                          border border-amber-500/30 bg-amber-500/15
                                                          px-2 py-0.5 text-[11px] font-semibold
                                                          text-amber-700
                                                          dark:text-amber-300
                                                        ">
                                                            Draft
                                                        </span>
                                                    )}
                                                    <TagPill
                                                        label={
                                                            (
                                                                post.data.tags as
                                                                    | string[]
                                                                    | undefined
                                                            )?.[0] ?? 'article'
                                                        }
                                                    />
                                                </span>
                                            </div>
                                            <div>
                                                <h3
                                                    className="
                                                      font-heading text-lg font-bold tracking-tight
                                                      text-foreground
                                                      group-hover:text-primary
                                                    ">
                                                    {post.data.title}
                                                </h3>
                                                <p
                                                    className="
                                                  mt-1 line-clamp-2 text-sm/relaxed
                                                  text-muted-foreground
                                                ">
                                                    {post.data.description}
                                                </p>
                                            </div>
                                        </div>
                                    </BentoBase>
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div
                    className="
                  mt-10 flex flex-col gap-3 border-t border-border pt-6
                  md:flex-row md:items-center md:justify-between
                ">
                    <p className="text-sm text-muted-foreground">
                        New articles land here first, then on social channels.
                    </p>
                    <div className="flex gap-2">
                        <Link
                            href="/blog/rss.xml"
                            className="
                              inline-flex h-8 items-center rounded-full bg-foreground px-4 text-sm
                              font-medium text-background
                              hover:bg-foreground/90
                            ">
                            RSS
                        </Link>
                        <Link
                            href="/docs"
                            className="
                              inline-flex h-8 items-center rounded-full border border-border px-4
                              text-sm font-medium
                              hover:bg-muted
                            ">
                            Docs
                        </Link>
                    </div>
                </div>
            </main>
        </BlogShell>
    )
}
