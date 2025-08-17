import React from 'react'

interface Props {
    strategyName: string
    children: React.ReactNode
}
export const BaseControls = ({ strategyName, children }: Props) => {
    return (
        <div className="bg-background p-4 border border-border border-dashed">
            <h3 className="text-base font-semibold mb-4">{strategyName} Settings</h3>
            <div className="flex flex-col md:flex-row items-end gap-4 text-sm ">{children}</div>
        </div>
    )
}
