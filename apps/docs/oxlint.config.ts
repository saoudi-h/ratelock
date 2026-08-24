import { base, next, tailwind } from '@tala-tools/oxlint'
import { defineConfig } from 'oxlint'

export default defineConfig({
    extends: [base, next, tailwind],
    ignorePatterns: ['.next', '.source', 'node_modules', 'next-env.d.ts'],
    rules: {
        // Canonical pipeline order: oxfmt runs FIRST, oxlint runs LAST, so
        // this rule owns the final shape of className wrapping. Consequence:
        // a few docs files intentionally keep the plugin's canonical form and
        // are reported by `oxfmt --check`; lint is the gated tool, not format.
        // preferSingleLine avoids splitting short class strings into
        // pointless multiline templates; printWidth mirrors the oxfmt preset.
        'better-tailwindcss/enforce-consistent-line-wrapping': [
            'warn',
            { preferSingleLine: true, printWidth: 100 },
        ],
    },
    settings: {
        'better-tailwindcss': {
            entryPoint: './src/app/globals.css',
            detectComponentClasses: true,
            ignore: [
                'toaster',
                'data-*',
                'cn-*',
                'no-scrollbar',
                'not-prose',
                'animate-event-pop',
                'animate-token-enter',
                'animate-token-exit',
            ],
        },
    },
})
