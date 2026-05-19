import Link from 'next/link'

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col justify-center text-center">
            <h1 className="mb-4 text-4xl font-bold">Ratelock</h1>
            <p className="text-fd-muted-foreground">
                A high-performance rate limiting suite for TypeScript.
            </p>
            <div className="mt-8">
                <Link
                    href="/docs"
                    className="
                      rounded-md bg-fd-primary px-4 py-2 font-medium
                      text-fd-primary-foreground
                    ">
                    View Documentation
                </Link>
            </div>
        </main>
    )
}
