import { Share, type LucideIcon } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { LinkButton, type LinkButtonProps } from '@/components/ui/link-button'

type ProfileSocial = {
  label: string
  icon: LucideIcon
}

type ProfileCardProps = {
  name: string
  handle?: string
  bio?: string
  avatar?: string
  links?: LinkButtonProps[]
  socials?: ProfileSocial[]
  width?: number
  showChrome?: boolean
  footer?: boolean
}

export function ProfileCard({
  name,
  handle,
  bio,
  avatar,
  links = [],
  socials = [],
  width = 340,
  showChrome = true,
  footer = true,
}: ProfileCardProps) {
  return (
    <div
      className="box-border flex max-w-full flex-col items-center gap-4 rounded-xl bg-cream-100 px-[18px] pt-5 pb-[22px] font-sans text-fg-primary shadow-lg"
      style={{ width }}
    >
      {showChrome && (
        <div className="flex self-stretch justify-between">
          <span className="flex h-[34px] items-center rounded-sm bg-white px-3 text-[12px] font-bold tracking-[-0.01em]">
            linkbase
          </span>
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-sm bg-white">
            <Share size={16} aria-hidden="true" />
          </span>
        </div>
      )}
      <Avatar name={name} src={avatar} size={88} />
      <div className="flex flex-col gap-1 text-center">
        <div className="text-[20px] font-bold tracking-heading">{name}</div>
        {handle && <div className="font-mono text-[13px] text-fg-muted">@{handle}</div>}
        {bio && (
          <div className="mt-1 text-[14px] leading-[1.45] text-pretty text-fg-secondary">{bio}</div>
        )}
      </div>
      {socials.length > 0 && (
        <ul className="m-0 flex list-none gap-3.5 p-0">
          {socials.map(({ label, icon: Icon }) => (
            <li key={label}>
              <Icon size={20} aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </li>
          ))}
        </ul>
      )}
      {links.length > 0 && (
        <div className="flex flex-col gap-2.5 self-stretch">
          {links.map((link) => (
            <LinkButton key={link.title} {...link} />
          ))}
        </div>
      )}
      {footer && <div className="mt-1 text-[12px] text-fg-muted">Made with Linkbase</div>}
    </div>
  )
}
