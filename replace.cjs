const fs = require('fs')
const path = require('path')

const REPLACEMENTS = [
    [/createFixedWindowLimiter/g, 'fixedWindow'],
    [/createSlidingWindowLimiter/g, 'slidingWindow'],
    [/createTokenBucketLimiter/g, 'tokenBucket'],
    [/createIndividualFixedWindowLimiter/g, 'individualFixedWindow'],
    [/withErrorPolicy/g, 'withFallback'],
    [/ErrorPolicy/g, 'FallbackPolicy'],
    [/errorPolicy:/g, 'fallback:'],
    [/errorPolicy\?/g, 'fallback?'],
]

function walk(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            walk(fullPath)
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8')
            let changed = false
            for (const [regex, replacement] of REPLACEMENTS) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement)
                    changed = true
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content)
                console.log('Updated', fullPath)
            }
        }
    }
}

walk(__dirname)
