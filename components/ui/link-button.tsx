import type { LucideIcon } from 'lucide-react'

type LinkButtonVariant = 'filled' | 'outline' | 'accent'

export type LinkButtonProps = {
  title: string
  href?: string
  variant?: LinkButtonVariant
  thumbIcon?: LucideIcon
}

const variantClasses: Record<LinkButtonVariant, string> = {
  filled: 'bg-white text-fg-primary shadow-sm',
  outline: 'border-ink-900 bg-transparent text-fg-primary',
  accent: 'bg-accent text-white shadow-sm',
}

const interactiveClasses: Record<LinkButtonVariant, string> = {
  filled: 'motion-safe:hover:-translate-y-0.5 hover:shadow-md',
  outline: 'hover:bg-overlay-hover',
  accent: 'motion-safe:hover:-translate-y-0.5 hover:shadow-md',
}

/** Returns the URL only when it parses with an http(s) protocol (docs/security.md, "URLs"). */
function toSafeUrl(href: string | undefined): string | undefined {
  if (!href) return undefined
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function LinkButton({ title, href, variant = 'filled', thumbIcon: ThumbIcon }: LinkButtonProps) {
  const safeUrl = toSafeUrl(href)
  const className = [
    'relative flex min-h-[58px] w-full items-center justify-center rounded-md border-[1.5px] border-transparent px-12 py-2 text-center text-[16px] leading-[1.25] font-semibold no-underline',
    'transition-[transform,box-shadow,background-color] duration-200 ease-brand',
    variantClasses[variant],
    safeUrl &&
      `${interactiveClasses[variant]} motion-safe:active:scale-[.985] focus-visible:outline-none focus-visible:shadow-focus`,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {ThumbIcon && (
        <span className="absolute top-1/2 left-2 flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center overflow-hidden rounded-sm bg-clay-100 text-clay-700">
          <ThumbIcon size={20} aria-hidden="true" />
        </span>
      )}
      <span>{title}</span>
    </>
  )

  if (!safeUrl) {
    return <div className={className}>{content}</div>
  }

  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  )
}
