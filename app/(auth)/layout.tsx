import Link from 'next/link'
import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-olive-700 px-4 py-12">
      <Link
        href="/"
        className="rounded-sm font-display text-[28px] font-extrabold tracking-wordmark text-cream-50 no-underline focus-visible:shadow-focus focus-visible:outline-none"
      >
        linkbase
      </Link>
      <main className="w-full max-w-[440px] rounded-xl bg-cream-50 p-[clamp(24px,5vw,40px)] shadow-lg">
        {children}
      </main>
    </div>
  )
}
