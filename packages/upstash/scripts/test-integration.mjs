import { spawn } from 'node:child_process'

const composeArgs = ['compose', '-p', 'ratelock-upstash-test', '-f', 'docker-compose.test.yml']

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: process.cwd(),
            stdio: 'inherit',
            ...options,
        })

        child.on('error', reject)
        child.on('exit', (code, signal) => {
            resolve(code ?? (signal ? 1 : 0))
        })
    })
}

const up = await run('docker', [...composeArgs, 'up', '-d', '--wait'])
if (up !== 0) process.exit(up)

let testExitCode = 1
try {
    testExitCode = await run(
        'pnpm',
        ['exec', 'vitest', 'run', '--config', 'vitest.integration.config.ts'],
        {
            env: {
                ...process.env,
                UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:8079',
                UPSTASH_REDIS_REST_TOKEN: 'ratelock-integration-token',
            },
        }
    )
} finally {
    await run('docker', [...composeArgs, 'down', '--remove-orphans'])
}

process.exit(testExitCode)
