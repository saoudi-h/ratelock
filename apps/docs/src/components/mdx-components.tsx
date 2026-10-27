import {
    CodeBlockTab,
    CodeBlockTabs as FumadocsCodeBlockTabs,
    CodeBlockTabsList,
    CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ComponentProps } from 'react'

import { FrameworkLink } from '~/components/framework-link'

function CodeBlockTabs(props: ComponentProps<typeof FumadocsCodeBlockTabs>) {
    return (
        <div className="not-prose">
            <FumadocsCodeBlockTabs {...props} />
        </div>
    )
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultMdxComponents,
        // Fumadocs renders internal links of the MDX content with this
        // component, so they navigate through the client router.
        a: ({ href, ...props }) =>
            href && href.startsWith('/') ? (
                <FrameworkLink href={href} {...props} />
            ) : (
                <a href={href} {...props} />
            ),
        // `<AutoTypeTable>` of the MDX content is precomputed into a static
        // `<TypeTable>` by the remark plugin of `source.config.ts`.
        TypeTable,
        CodeBlockTab,
        CodeBlockTabs,
        CodeBlockTabsList,
        CodeBlockTabsTrigger,
        Tab,
        Tabs,
        ...components,
    }
}

export function useMDXComponents(components?: MDXComponents): MDXComponents {
    return getMDXComponents(components)
}
