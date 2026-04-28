import Link from 'next/link'
import { FooterBackground } from '../FooterBackground'
import { Section } from '../Section'
import { SectionWrapper } from '../SectionWrapper'

export const Footer = () => {
    return (
        <SectionWrapper className="relative min-h-96 border-none">
            <div
                className="
                  opacity-mask absolute top-0 left-0 h-44 w-full border-x
                  border-dashed border-border
                "></div>
            <FooterBackground
                className="
                  absolute top-0 left-1/2 w-[200%] -translate-x-1/2 transform
                "
            />
            <div className="h-72"></div>
            <Section className="relative size-full py-24 pt-72">
                <footer className="relative">
                    <div
                        className="
                          flex flex-col items-center justify-between py-12
                          text-muted-foreground
                          md:flex-row
                        ">
                        <div className="font-serif text-xl font-bold">RateLock</div>
                        <Link href="https://github.com/saoudi-h/ratelock" className="
                          text-primary
                        ">
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
