import 'server-only'

import { getSession } from '@/lib/auth/get-session'

type CurrentUser = {
  email: string
}

/**
 * The signed-in user's email for UI such as the header, or null when signed out.
 * Reads the session cookie only, so callers must sit inside <Suspense>. Not an access check:
 * pages and Server Actions use requireUserId().
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession()
  const user = session?.user
  if (!user?.id || !user.email) return null

  return { email: user.email }
}
