import { execSync } from 'child_process'
import consola from 'consola'
import { line } from './draw'
import { loadEnv } from './env'

export async function withDocker(command: () => Promise<unknown> | unknown) {
    try {
        line()
        loadEnv()
        consola.box('Starting Docker')
        execSync('pnpm docker:up', { stdio: 'inherit' })

        consola.info('Running command')
        await command()

        consola.info('Stopping Docker')
        execSync('pnpm docker:down', { stdio: 'inherit' })
        consola.success('Done')
        process.exit(0)
    } catch (error) {
        consola.error(error)
        process.exit(1)
    }
}
