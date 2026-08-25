export function TagPill({ label }: { label: string }) {
    return (
        <span
            className={`
              inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10
              px-2.5 py-0.5 text-sm font-semibold text-primary select-none
            `}>
            {label}
        </span>
    )
}