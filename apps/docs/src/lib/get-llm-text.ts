import type { Page } from 'fumadocs-core/source'

export async function getLLMText(page: Page): Promise<string> {
     
    const text = await (page.data as any).getText('processed')
    return `# ${page.data.title}\n\n${page.data.description}\n\nURL: ${page.url}\n\n${text}`
}
