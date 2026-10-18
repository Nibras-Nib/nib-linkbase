'use client'

import { ChevronDown, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { Avatar } from '@/components/ui/avatar'

import { menuItemClassName } from './menu-item'

type UserMenuProps = {
  email: string
  /** Extra menu items rendered on the server, such as the sign-out form */
  children?: ReactNode
}

function getMenuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) : []
}

export function UserMenu({ email, children }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Close after navigating. The route stays mounted in a hidden <Activity>, so state would otherwise survive.
  const pathname = usePathname()
  const [openPathname, setOpenPathname] = useState(pathname)
  if (pathname !== openPathname) {
    setOpenPathname(pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    getMenuItems(menuRef.current)[0]?.focus()

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = getMenuItems(menuRef.current)
    const index = items.findIndex((item) => item === document.activeElement)

    const nextIndex: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      close({ restoreFocus: true })
    } else if (event.key in nextIndex) {
      event.preventDefault()
      items[nextIndex[event.key]]?.focus()
    } else if (event.key === 'Tab') {
      close({ restoreFocus: false })
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (isOpen && !containerRef.current?.contains(event.relatedTarget)) {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu for ${email}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-11 cursor-pointer items-center gap-1 rounded-full py-1 pr-2 pl-1 text-ink-700 transition-colors duration-200 hover:bg-overlay-hover focus-visible:shadow-focus focus-visible:outline-none"
      >
        {/* Initials come from the email's first letter until profiles have a display name */}
        <Avatar name={email} size={36} />
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-2 w-64 rounded-md border border-line-subtle bg-surface-card p-1.5 shadow-md"
        >
          <div className="border-b border-line-subtle px-3 pt-2 pb-3">
            <p className="text-[13px] text-fg-muted">Signed in as</p>
            <p className="truncate text-[15px] font-semibold text-fg-primary">{email}</p>
          </div>
          <div className="flex flex-col pt-1.5">
            <Link href="/dashboard" role="menuitem" tabIndex={-1} className={menuItemClassName}>
              <LayoutDashboard size={18} aria-hidden="true" />
              Dashboard
            </Link>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
