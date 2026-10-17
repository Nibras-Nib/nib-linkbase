type AvatarProps = {
  name: string
  src?: string
  size?: number
  ring?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function Avatar({ name, src, size = 48, ring = false }: AvatarProps) {
  return (
    <span
      className={`inline-flex flex-none items-center justify-center overflow-hidden rounded-full bg-clay-100 font-bold text-clay-700 ${ring ? 'shadow-[0_0_0_3px_var(--color-cream-50),0_0_0_5px_var(--color-clay-500)]' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar sources are arbitrary; next/image remotePatterns are configured per docs/security.md when real avatars land
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <>
          <span aria-hidden="true">{getInitials(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </span>
  )
}
