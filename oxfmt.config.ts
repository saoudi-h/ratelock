import preset from '@tala-tools/oxfmt'

export default {
    ...preset,
    ignorePatterns: ['**/CHANGELOG.md', 'apps/docs/src/generated/**'],
}
