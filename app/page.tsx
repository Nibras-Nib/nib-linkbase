import { Faq } from '@/components/marketing/faq'
import { FinalCta } from '@/components/marketing/final-cta'
import { Hero } from '@/components/marketing/hero'
import { Reasons } from '@/components/marketing/reasons'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteNav } from '@/components/marketing/site-nav'

export default function HomePage() {
  return (
    <div className="flex-1 bg-olive-700">
      <SiteNav />
      <main>
        <Hero />
        <Reasons />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
