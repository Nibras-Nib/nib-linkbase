import type { NextAuthConfig } from 'next-auth'

// Shared by proxy.ts and lib/auth/auth.ts. No database code here: Proxy loads this file on
// every request. Providers that need the database are added in lib/auth/auth.ts.
export const authConfig = {
  providers: [],
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // re-issue the cookie at most once a day
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
} satisfies NextAuthConfig
