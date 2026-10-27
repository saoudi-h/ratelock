import { createFileRoute, Outlet } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'

import '~/generated/icons-core'
import { FooterSection } from '~/components/home/sections/footer-section'
import { homeOptions } from '~/lib/layout-options'

export const Route = createFileRoute('/_site')({
    component: SiteLayout,
})

function SiteLayout() {
    return (
        <HomeLayout {...homeOptions}>
            <Outlet />
            <FooterSection />
        </HomeLayout>
    )
}
