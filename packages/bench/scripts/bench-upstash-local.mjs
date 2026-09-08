import { spawn } from 'node:child_process'

const composeArgs = [
    'compose',
    '-p',
    'ratelock-upstash-benchmark',
    '-f',
    '../upstash/docker-compose.test.yml',
]

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

let benchmarkExitCode = 1

try {
    const up = await run('docker', [...composeArgs, 'up', '-d', '--wait'])
    if (up === 0) {
        benchmarkExitCode = await run('pnpm', ['exec', 'tsx', 'src/upstash.ts'], {
            env: {
                ...process.env,
                BENCH_UPSTASH_MODE: 'local',
                UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:8079',
                UPSTASH_REDIS_REST_TOKEN: 'ratelock-integration-token',
            },
        })
    } else {
        benchmarkExitCode = up
    }
} finally {
    await run('docker', [...composeArgs, 'down', '--remove-orphans'])
}

process.exit(benchmarkExitCode)
