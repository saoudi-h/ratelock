import consola from 'consola'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

let loaded = false

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function loadEnv(envPath: string = '../../.env.test') {
    if (loaded) return

    const absolutePath = path.resolve(__dirname, envPath)
    consola.info(`Loading environment variables from ${absolutePath}`)

    const result = dotenv.config({ path: absolutePath })

    if (result.error) {
        consola.error('Failed to load environment variables:')
        throw result.error
    }

    loaded = true
    consola.success('Environment variables loaded successfully')
}
