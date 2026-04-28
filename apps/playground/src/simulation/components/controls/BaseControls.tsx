import React from 'react'

interface Props {
    strategyName: string
    children: React.ReactNode
}
export const BaseControls = ({ strategyName, children }: Props) => {
    return (
        <div className="border border-dashed border-border bg-background p-4">
            <h3 className="mb-4 text-base font-semibold">{strategyName} Settings</h3>
            <div
                className="
                  flex flex-col items-end gap-4 text-sm
                  md:flex-row
                ">
                {children}
            </div>
        </div>
    )
}
