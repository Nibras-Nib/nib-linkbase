import type { Metadata } from 'next'
import { Suspense } from 'react'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { requireUserId } from '@/lib/auth/require-user-id'

export const metadata: Metadata = {
  title: 'Dashboard · Linkbase',
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-[38px] w-72 rounded-sm bg-surface-sunken" />}>
      <Welcome />
    </Suspense>
  )
}

async function Welcome() {
  await requireUserId()
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-h1 text-fg-primary">Welcome to Linkbase</h1>
      <p className="text-[16px] text-fg-muted">
        Signed in as {user?.email}. Your links will live here.
      </p>
    </div>
  )
}
