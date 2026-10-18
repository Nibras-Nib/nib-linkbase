import type { Metadata } from 'next'
import { Suspense } from 'react'

import { safeCallbackUrl } from '@/lib/validation/auth'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { SignupForm } from '@/components/auth/signup-form'

import { signUpWithCredentials } from '../actions'

export const metadata: Metadata = {
  title: 'Sign up · Linkbase',
}

export default function SignupPage({ searchParams }: PageProps<'/signup'>) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h2 text-fg-primary">Create your Linkbase</h1>
        <p className="text-[15px] text-fg-muted">One page for everything you make. Free to start.</p>
      </header>
      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <SignupFormWithCallback searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function SignupFormWithCallback({ searchParams }: Pick<PageProps<'/signup'>, 'searchParams'>) {
  const { callbackUrl } = await searchParams
  return (
    <SignupForm
      action={signUpWithCredentials}
      callbackUrl={typeof callbackUrl === 'string' ? safeCallbackUrl(callbackUrl) : undefined}
    />
  )
}
