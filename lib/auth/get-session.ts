import 'server-only'
import { cache } from 'react'

import { auth } from '@/lib/auth/auth'

/**
 * The current session, read once per request. The header, the page and requireUserId() can each
 * call it during one render without decoding the cookie again (React.cache is per request, so
 * nothing is shared between users). Outside a render, such as in a Server Action, it calls auth() directly.
 */
export const getSession = cache(async () => auth())
