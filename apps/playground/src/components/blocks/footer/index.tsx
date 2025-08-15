import Link from 'next/link'
import { Section } from '../Section'
import { SectionWrapper } from '../SectionWrapper'

export const Footer = () => {
    return (
        <SectionWrapper className="border-border border-dashed border-t">
            <Section className="relative w-full">
                <div className="inset-0 absolute h-full w-full text-border/20 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]" />
                <footer className="relative">
                    <div className="flex flex-col items-center justify-between py-12 text-muted-foreground md:flex-row">
                        <div className="font-bold font-serif text-xl">RateLock</div>
                        <Link href="https://github.com/saoudi-h/ratelock" className="text-primary">
                            Github
                        </Link>
                        <Link
                            href="https://www.npmjs.com/package/@ratelock/"
                            className="text-primary">
                            npm
                        </Link>
                    </div>
                </footer>
            </Section>
        </SectionWrapper>
    )
}
