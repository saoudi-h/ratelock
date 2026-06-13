import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript'
import type { AutoTypeTableProps } from 'fumadocs-typescript/ui';
import { AutoTypeTable } from 'fumadocs-typescript/ui'
import {
    CodeBlockTab,
    CodeBlockTabs as FumadocsCodeBlockTabs,
    CodeBlockTabsList,
    CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ComponentProps } from 'react'

const generator = createGenerator({
  // set a cache, necessary for serverless platform like Vercel
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});

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
        AutoTypeTable: (props: Partial<AutoTypeTableProps>) => (
          <AutoTypeTable {...props} generator={generator} />
        ),        CodeBlockTab,
        CodeBlockTabs,
        CodeBlockTabsList,
        CodeBlockTabsTrigger,
        Tab,
        Tabs,
        ...components,
    }
}
