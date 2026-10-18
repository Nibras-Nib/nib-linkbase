import { LogOut } from 'lucide-react'

import { signOut } from '@/lib/auth/auth'

import { menuItemClassName } from './menu-item'

export function SignOutForm() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
    >
      <button type="submit" role="menuitem" tabIndex={-1} className={menuItemClassName}>
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </button>
    </form>
  )
}
