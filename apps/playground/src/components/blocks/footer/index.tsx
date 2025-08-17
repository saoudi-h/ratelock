import Link from 'next/link'
import { Section } from '../Section'
import { SectionWrapper } from '../SectionWrapper'
import { FooterBackground } from '../FooterBackground'

export const Footer = () => {
    return (


        <SectionWrapper className="relative border-none min-h-96">
            <div className="opacity-mask absolute w-full border-x border-border border-dashed h-44 top-0 left-0"></div>
            <FooterBackground className="w-[200%] absolute top-0 left-1/2 transform -translate-x-1/2"/>
            <div className="h-72"></div>
            <Section className="relative w-full py-24 pt-72 h-full">
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
