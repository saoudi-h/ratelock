import { generateOGImage } from '@/lib/og-template'

export const revalidate = false

export async function GET() {
    return generateOGImage({
        title: 'RateLock',
        description: 'Bulletproof rate limiting for modern applications',
        badge: 'RATELOCK',
    })
}
