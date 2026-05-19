import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export const baseOptions: BaseLayoutProps = {
    nav: {
        title: 'Ratelock',
    },
    links: [
        {
            text: 'Documentation',
            url: '/docs',
            active: 'nested-url',
        },
    ],
    githubUrl: 'https://github.com/saoudi-h/ratelock',
}
