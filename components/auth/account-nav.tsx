import { getCurrentUser } from '@/lib/auth/get-current-user'
import { Button } from '@/components/ui/button'

import { SignOutForm } from './sign-out-form'
import { UserMenu } from './user-menu'

/** The header's account slot. Reads the session, so render it inside <Suspense>. */
export async function AccountNav() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex flex-none gap-2">
        <Button href="/login" variant="secondary" size="sm">
          Log in
        </Button>
        <Button href="/signup" variant="dark" size="sm">
          Sign up free
        </Button>
      </div>
    )
  }

  return (
    <UserMenu email={user.email}>
      <SignOutForm />
    </UserMenu>
  )
}

/** Same footprint as the signed-out buttons, so the header doesn't shift when the session streams in. */
export function AccountNavSkeleton() {
  return <div aria-hidden="true" className="h-11 w-[180px] flex-none" />
}
