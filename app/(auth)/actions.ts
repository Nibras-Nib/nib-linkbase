'use server'
import { CredentialsSignin } from 'next-auth'
import { redirect } from 'next/navigation'

import { signIn } from '@/lib/auth/auth'
import { hashPassword } from '@/lib/auth/password'
import { createUser, EmailTakenError } from '@/lib/db/users'
import { getClientIpKey, rateLimit, rateLimits } from '@/lib/security/rate-limit'
import { type ActionResult, formFailure, validationFailure } from '@/lib/validation/action-result'
import {
  safeCallbackUrl,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from '@/lib/validation/auth'

// These actions run before there's a session, so they don't call requireUserId(). The rate
// limit is their first step instead (docs/security.md, "Rate limiting").

export type SignInResult = ActionResult<undefined, keyof SignInInput>
export type SignUpResult = ActionResult<undefined, keyof SignUpInput>

const TOO_MANY_ATTEMPTS = 'Too many attempts. Try again in a few minutes.'
const INCORRECT_CREDENTIALS = 'Email or password is incorrect'

export async function signInWithCredentials(
  _previous: SignInResult | null,
  formData: FormData,
): Promise<SignInResult> {
  const input = Object.fromEntries(formData)
  const values = { email: String(input.email ?? '') }

  const limit = await rateLimit(`sign-in:${await getClientIpKey()}`, rateLimits.signIn)
  if (!limit.ok) return formFailure(TOO_MANY_ATTEMPTS, values)

  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error, values)

  const signedIn = await startSession(parsed.data)
  if (!signedIn) return formFailure(INCORRECT_CREDENTIALS, values)

  redirect(safeCallbackUrl(input.callbackUrl))
}

export async function signUpWithCredentials(
  _previous: SignUpResult | null,
  formData: FormData,
): Promise<SignUpResult> {
  const input = Object.fromEntries(formData)
  const values = { email: String(input.email ?? '') }

  const limit = await rateLimit(`sign-up:${await getClientIpKey()}`, rateLimits.signUp)
  if (!limit.ok) return formFailure(TOO_MANY_ATTEMPTS, values)

  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error, values)

  const { email, password } = parsed.data
  try {
    await createUser({ email, passwordHash: await hashPassword(password) })
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return {
        ok: false,
        fieldErrors: { email: ['An account with this email already exists'] },
        values,
      }
    }
    throw error
  }

  // The account was just created with this password, so a failure here means something is broken
  const signedIn = await startSession({ email, password })
  if (!signedIn) throw new Error('Failed to start a session after sign-up')

  redirect(safeCallbackUrl(input.callbackUrl))
}

/** Sets the session cookie. Returns false for wrong credentials; other auth errors are thrown. */
async function startSession({ email, password }: SignInInput): Promise<boolean> {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return true
  } catch (error) {
    if (error instanceof CredentialsSignin) return false
    throw error
  }
}
