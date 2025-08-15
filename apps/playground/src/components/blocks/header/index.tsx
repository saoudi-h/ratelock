import { LogoLink } from '@/components/widget/LogoLink'
import { ThemeToggle } from '@/components/widget/ThemeToggle'
import { BaseHeader } from './BaseHeader'

export const Header = () => {
    return (
        <BaseHeader>
            <div className="flex items-center">
                <div className="flex shrink-0 items-center">
                    <LogoLink />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div
                    className={`
                  hidden items-center gap-2
                  lg:flex
                `}>
                    <ThemeToggle
                        className={`
                      shrink-0
                      max-md:hidden
                    `}
                    />
                </div>
            </div>
        </BaseHeader>
    )
}
