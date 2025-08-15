import React from 'react'
import { Section } from '../Section'
import { SectionWrapper } from '../SectionWrapper'

export const BaseHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <header className="sticky top-0 left-0 z-40 w-full">
        <div className="absolute inset-0 size-full bg-background/60" />
        <nav
            className={`
          border-border border-dashed z-40 border-b backdrop-blur-md transition-opacity
        `}>
            <SectionWrapper>
                <Section className="flex h-16 items-center justify-between">{children}</Section>
            </SectionWrapper>
        </nav>
    </header>
)
