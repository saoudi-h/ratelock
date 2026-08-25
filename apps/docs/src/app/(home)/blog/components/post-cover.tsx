import Image from 'next/image'

type PostCoverPost = {
    slugs: string[]
    data: {
        title: string
        image?: string
    }
}

const FALLBACK_SRC = '/blog-fallback-thumbnail.png'

/**
 * Decorative, text-free cover for a blog article.
 * Uses the article frontmatter `image` when defined; otherwise renders the
 * shared generated fallback at `public/blog-fallback-thumbnail.png`.
 *
 * The fallback is intentionally non-semantic: a purely aesthetic pattern.
 * Do not attempt to illustrate rate-limiting concepts; the image is
 * decorative only.
 */
export function PostCover({
    post,
    sizes,
    priority = false,
    className,
}: {
    post: PostCoverPost
    sizes: string
    priority?: boolean
    className?: string
}) {
    const src = post.data.image ?? FALLBACK_SRC

    return (
        <div className={`relative overflow-hidden bg-card ${className ?? ''}`}>
            <Image
                src={src}
                alt=""
                fill
                sizes={sizes}
                priority={priority}
                className="object-cover"
            />
        </div>
    )
}
