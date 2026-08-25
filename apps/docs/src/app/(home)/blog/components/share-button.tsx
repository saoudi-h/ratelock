'use client'

import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CopyIcon, ShareIcon } from '@solar-icons/react/linear';

export function ShareButton({ url }: { url: string }) {
    const [checked, onCopy] = useCopyButton(async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${url}`)
    })

    return (
        <Button
            size="sm"
            variant="secondary"
            className={cn( `gap-2`)}
            onClick={onCopy}>
            {checked ? 'Copied' : 'Share'}
            {checked ? <CopyIcon className="size-4" /> : <ShareIcon className="size-4" /> }
        </Button>
    )
}
