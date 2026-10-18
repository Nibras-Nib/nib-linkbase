import type { Metadata } from 'next'
import { Suspense } from 'react'

import { safeCallbackUrl } from '@/lib/validation/auth'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { LoginForm } from '@/components/auth/login-form'

import { signInWithCredentials } from '../actions'

export const metadata: Metadata = {
  title: 'Log in · Linkbase',
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h2 text-fg-primary">Welcome back</h1>
        <p className="text-[15px] text-fg-muted">Log in to manage your page and links.</p>
      </header>
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginFormWithCallback searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function LoginFormWithCallback({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { callbackUrl } = await searchParams
  return (
    <LoginForm
      action={signInWithCredentials}
      callbackUrl={typeof callbackUrl === 'string' ? safeCallbackUrl(callbackUrl) : undefined}
    />
  )
}
