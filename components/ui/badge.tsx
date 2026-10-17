import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'clay' | 'olive' | 'ochre' | 'dark'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  icon?: LucideIcon
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-fg-secondary',
  clay: 'bg-clay-100 text-clay-700',
  olive: 'bg-olive-100 text-olive-700',
  ochre: 'bg-ochre-100 text-ochre-700',
  dark: 'bg-ink-900 text-cream-50',
}

export function Badge({ children, tone = 'neutral', icon: Icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-[5px] rounded-full px-2.5 text-[12px] leading-none font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  )
}
