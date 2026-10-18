'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import type { ActionResult } from '@/lib/validation/action-result'
import type { SignUpInput } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

import { FormAlert } from './form-alert'

type SignUpResult = ActionResult<undefined, keyof SignUpInput>

type SignupFormProps = {
  action: (previous: SignUpResult | null, formData: FormData) => Promise<SignUpResult>
  callbackUrl?: string
}

export function SignupForm({ action, callbackUrl }: SignupFormProps) {
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
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters, with a letter and a number"
        error={failure?.fieldErrors.password?.[0]}
      />
      <PasswordInput
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        required
        error={failure?.fieldErrors.confirmPassword?.[0]}
      />

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? 'Creating your account…' : 'Create account'}
      </Button>

      <p className="text-center text-[14px] text-fg-muted">
        Already have an account?{' '}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'}
          className="rounded-xs font-semibold text-accent underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          Log in
        </Link>
      </p>
    </form>
  )
}
