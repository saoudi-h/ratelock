import { createServerFn } from '@tanstack/react-start'
import type { App } from 'octokit'
import { z } from 'zod'

export const repo = 'ratelock'
export const owner = 'saoudi-h'
export const DocsCategory = 'Docs Feedback'

const feedbackInput = z.object({
    url: z.string().min(1),
    opinion: z.string().min(1),
    message: z.string().min(1),
})

interface RepositoryInfo {
    id: string
    discussionCategories: {
        nodes: {
            id: string
            name: string
        }[]
    }
}

type Octokit = Awaited<ReturnType<InstanceType<typeof App>['getInstallationOctokit']>>

async function createOctokit(): Promise<Octokit> {
    const appId = process.env.GITHUB_APP_ID
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
    if (!appId || !privateKey) {
        throw new Error('GitHub comment integration is not configured.')
    }

    const { App } = await import('octokit')
    const app = new App({ appId, privateKey })

    const { data } = await app.octokit.request('GET /repos/{owner}/{repo}/installation', {
        owner,
        repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
        },
    })

    return app.getInstallationOctokit(data.id)
}

let instance: Promise<Octokit> | undefined

function getOctokit(): Promise<Octokit> {
    return (instance ??= createOctokit())
}

let cachedDestination: RepositoryInfo | undefined

async function getFeedbackDestination() {
    if (cachedDestination) return cachedDestination
    const octokit = await getOctokit()

    const {
        repository,
    }: {
        repository: RepositoryInfo
    } = await octokit.graphql(`
  query {
    repository(owner: "${owner}", name: "${repo}") {
      id
      discussionCategories(first: 25) {
        nodes { id name }
      }
    }
  }
`)

    return (cachedDestination = repository)
}

/**
 * Server function behind the docs feedback widget. It writes the feedback to
 * the `Docs Feedback` GitHub Discussions category, exactly like the server
 * action of the Next app. It runs as a serverless function on Vercel; the
 * secrets come from the environment of the deployment.
 */
export const onRateAction = createServerFn({ method: 'POST' })
    .validator(feedbackInput)
    .handler(async ({ data }): Promise<{ githubUrl: string }> => {
        const octokit = await getOctokit()
        const destination = await getFeedbackDestination()

        const category = destination.discussionCategories.nodes.find(
            node => node.name === DocsCategory
        )

        if (!category)
            throw new Error(`Please create a "${DocsCategory}" category in GitHub Discussions`)

        const title = `Feedback for ${data.url}`
        const body = `[${data.opinion}] ${data.message}\n\n> Forwarded from user feedback.`

        let {
            search: {
                nodes: [discussion],
            },
        }: {
            search: {
                nodes: { id: string; url: string }[]
            }
        } = await octokit.graphql(`
          query {
            search(type: DISCUSSION, query: ${JSON.stringify(`${title} in:title repo:${owner}/${repo} author:@me`)}, first: 1) {
              nodes {
                ... on Discussion { id, url }
              }
            }
          }`)

        if (discussion) {
            await octokit.graphql(`
            mutation {
              addDiscussionComment(input: { body: ${JSON.stringify(body)}, discussionId: "${discussion.id}" }) {
                comment { id }
              }
            }`)
        } else {
            const result: {
                discussion: { id: string; url: string }
            } = await octokit.graphql(`
            mutation {
              createDiscussion(input: { repositoryId: "${destination.id}", categoryId: "${category!.id}", body: ${JSON.stringify(body)}, title: ${JSON.stringify(title)} }) {
                discussion { id, url }
              }
            }`)

            discussion = result.discussion
        }

        return {
            githubUrl: discussion.url,
        }
    })
