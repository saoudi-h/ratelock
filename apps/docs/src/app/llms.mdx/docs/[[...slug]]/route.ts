import { source } from '@/lib/source'

export const revalidate = false

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug?: string[] }> }
) {
    const { slug } = await params
    const page = source.getPage(slug)
    if (!page) return new Response('Not found', { status: 404 })

    const text = await page.data.getText('processed')

    return new Response(text, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    })
}

export async function generateStaticParams() {
    return source.generateParams()
}
