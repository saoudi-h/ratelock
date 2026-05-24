import { Logo } from '@/components/ui-blocks/logo'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

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
    ],
    githubUrl: 'https://github.com/saoudi-h/ratelock',
}
