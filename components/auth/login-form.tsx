'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import type { ActionResult } from '@/lib/validation/action-result'
import type { SignInInput } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

import { FormAlert } from './form-alert'

type SignInResult = ActionResult<undefined, keyof SignInInput>

type LoginFormProps = {
  action: (previous: SignInResult | null, formData: FormData) => Promise<SignInResult>
  callbackUrl?: string
}

export function LoginForm({ action, callbackUrl }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const failure = state?.ok === false ? state : undefined

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {failure?.formError && <FormAlert message={failure.formError} />}
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

      <Input
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={failure?.values?.email}
        error={failure?.fieldErrors.email?.[0]}
      />
      <PasswordInput
        name="password"
        label="Password"
        autoComplete="current-password"
        required
        error={failure?.fieldErrors.password?.[0]}
      />

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </Button>

      <p className="text-center text-[14px] text-fg-muted">
        New to Linkbase?{' '}
        <Link
          href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup'}
          className="rounded-xs font-semibold text-accent underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
