import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    experimental: {
        reactCompiler: true,
    },
    reactStrictMode: true,
}

export default nextConfig
