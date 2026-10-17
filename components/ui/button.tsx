import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'outline' | 'ghost' | 'light'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
  onClick?: () => void
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 border-[1.5px] border-transparent font-semibold leading-none whitespace-nowrap cursor-pointer no-underline transition-[background-color,border-color,color,transform] duration-200 ease-brand motion-safe:active:scale-[.97] focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-45'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-press',
  dark: 'bg-ink-900 text-cream-50 hover:bg-ink-700',
  secondary: 'bg-surface-sunken text-fg-primary hover:bg-sand-300',
  outline: 'border-line bg-transparent text-fg-primary hover:border-line-strong',
  ghost: 'bg-transparent text-fg-primary hover:bg-overlay-hover',
  light: 'bg-cream-50 text-ink-900 hover:bg-white',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[14px] rounded-sm',
  md: 'h-12 px-[22px] text-[16px] rounded-md',
  lg: 'h-14 px-7 text-[17px] rounded-md',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  block = false,
  disabled = false,
  type = 'button',
  href,
  onClick,
}: ButtonProps) {
  const className = [baseClasses, variantClasses[variant], sizeClasses[size], block && 'w-full']
    .filter(Boolean)
    .join(' ')
  const iconSize = size === 'sm' ? 16 : 18

  const content = (
    <>
      {Icon && <Icon size={iconSize} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight size={iconSize} aria-hidden="true" />}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  )
}
