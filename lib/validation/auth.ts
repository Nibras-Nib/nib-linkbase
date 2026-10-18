import { z } from 'zod'

const DEFAULT_REDIRECT = '/dashboard'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }).max(254, { error: 'Enter a valid email address' }))

const newPasswordMessage = 'Use at least 8 characters, with a letter and a number'

const newPasswordSchema = z
  .string()
  .min(8, { error: newPasswordMessage })
  .max(128, { error: 'Keep it under 128 characters' })
  .regex(/[a-z]/i, { error: newPasswordMessage })
  .regex(/\d/, { error: newPasswordMessage })

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z
      .string({ error: 'Confirm your password' })
      .min(1, { error: 'Confirm your password' }),
  })
  .refine((input) => input.password === input.confirmPassword, {
    error: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Sign-in only checks shape: password rules may change, and old passwords must still work.
export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, { error: 'Enter your password' })
    .max(128, { error: 'Email or password is incorrect' }),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>

/**
 * Returns `value` only if it's a same-origin path (`/dashboard?tab=links`). Anything else,
 * including protocol-relative `//evil.com` and `/\evil.com`, falls back to `/dashboard`.
 */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return DEFAULT_REDIRECT
  if (value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_REDIRECT
  return value
}
