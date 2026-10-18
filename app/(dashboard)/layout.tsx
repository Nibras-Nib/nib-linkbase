import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'

import { AccountNav, AccountNavSkeleton } from '@/components/auth/account-nav'

type DashboardLayoutProps = {
  children: ReactNode
}

// No auth check here: layouts don't re-render on navigation. Each page calls requireUserId().
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-cream-50">
        <nav
          aria-label="Dashboard"
          className="mx-auto flex h-[68px] max-w-container items-center justify-between gap-4 px-[clamp(16px,3vw,24px)]"
        >
          <Link
            href="/dashboard"
            className="rounded-sm font-display text-[24px] font-extrabold tracking-wordmark text-ink-900 no-underline focus-visible:shadow-focus focus-visible:outline-none"
          >
            linkbase
          </Link>
          <Suspense fallback={<AccountNavSkeleton />}>
            <AccountNav />
          </Suspense>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-container flex-1 px-[clamp(16px,3vw,24px)] py-12">
        {children}
      </main>
    </div>
  )
}
