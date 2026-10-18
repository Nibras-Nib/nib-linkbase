import type { NextRequest } from 'next/server'

import { handlers } from '@/lib/auth/auth'
import { getClientIpKey, rateLimit, rateLimits } from '@/lib/security/rate-limit'

export const { GET } = handlers

// POST covers the credentials callback, so direct calls to the endpoint share the sign-in action's limit
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`sign-in:${await getClientIpKey()}`, rateLimits.signIn)
  if (!limit.ok) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    )
  }
  return handlers.POST(request)
}
