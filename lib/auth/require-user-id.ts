import 'server-only'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/get-session'

/** The signed-in user's id from the session. Redirects to /login when there's no session. */
export async function requireUserId(): Promise<string> {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) redirect('/login')
  return userId
}
