import 'server-only'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { authConfig } from '@/lib/auth/auth-config'
import { verifyPassword, verifyPasswordAgainstDummy } from '@/lib/auth/password'
import { findUserForSignIn } from '@/lib/db/users'
import { signInSchema } from '@/lib/validation/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email', label: 'Email' },
        password: { type: 'password', label: 'Password' },
      },
      // Returning null makes Auth.js throw CredentialsSignin, which the sign-in action turns into
      // one generic message. Never say whether the email or the password was wrong.
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await findUserForSignIn(email)
        const isValid = user
          ? await verifyPassword(password, user.passwordHash)
          : await verifyPasswordAgainstDummy(password)
        if (!user || !isValid) return null

        // The id becomes token.sub, then session.user.id: the userId every query is scoped by
        return { id: user.id, email: user.email }
      },
    }),
  ],
})
