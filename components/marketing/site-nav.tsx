import Link from 'next/link'

import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Product', href: '#features' },
  { label: 'Pricing', href: '#faq' },
  { label: 'FAQ', href: '#faq' },
]

export function SiteNav() {
  return (
    <div className="sticky top-3 z-10 -mb-20 px-[clamp(12px,3vw,24px)]">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] max-w-container items-center gap-4 rounded-lg bg-cream-50 py-0 pr-3 pl-[clamp(16px,3vw,24px)] shadow-md"
      >
        <Link
          href="/"
          className="flex-none rounded-sm font-display text-[24px] font-extrabold tracking-wordmark text-ink-900 no-underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          linkbase
        </Link>
        {/* Links that don't fit wrap onto a hidden second row instead of crowding the CTA */}
        <div className="flex h-9 min-w-0 flex-1 flex-wrap justify-start gap-1 overflow-hidden">
          {navLinks.map((link) => (
            <Button key={link.label} href={link.href} variant="ghost" size="sm">
              {link.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-none gap-2">
          <Button href="/login" variant="dark" size="sm">
            Sign up free
          </Button>
        </div>
      </nav>
    </div>
  )
}
