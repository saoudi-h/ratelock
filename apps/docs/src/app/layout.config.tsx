import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { Logo } from '@/components/ui-blocks/logo'

export const baseOptions: BaseLayoutProps = {
    nav: {
        title: <Logo iconClassName="size-6" />,
    },
    links: [
        {
            text: 'Documentation',
            url: '/docs',
            active: 'nested-url',
        },
        {
            text: 'Blog',
            url: '/blog',
            active: 'nested-url',
        },
    ],
    githubUrl: 'https://github.com/saoudi-h/ratelock',
}
