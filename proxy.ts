import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import { authConfig } from '@/lib/auth/auth-config'

// Edge-safe config only: Proxy checks the session cookie and never touches the database
const { auth } = NextAuth(authConfig)

// Deny by default. A new public page must be added here, and that change reviewed as a security change.
const PUBLIC_PATHS = [/^\/$/, /^\/login$/, /^\/signup$/, /^\/user\/[^/]+$/]
const AUTH_PAGES = [/^\/login$/, /^\/signup$/]

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  if (req.auth && AUTH_PAGES.some((path) => path.test(pathname))) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
  if (req.auth || PUBLIC_PATHS.some((path) => path.test(pathname))) return

  const loginUrl = new URL('/login', req.nextUrl)
  loginUrl.searchParams.set('callbackUrl', pathname + search)
  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: [
    // Everything except Auth.js endpoints, build output, and static files
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
