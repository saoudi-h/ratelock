import type { DocsLayoutProps } from 'fumadocs-ui/layouts/docs'
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { Logo } from '~/components/ui-blocks/logo'

export function baseOptions(): BaseLayoutProps {
    return {
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
}

export const docsOptions: Omit<DocsLayoutProps, 'tree'> = {
    ...baseOptions(),
}

export const homeOptions: HomeLayoutProps = {
    ...baseOptions(),
}
