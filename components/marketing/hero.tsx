import { Camera, Mail, ShoppingBag, SquarePlay } from 'lucide-react'

import { ProfileCard } from '@/components/ui/profile-card'

import { ClaimForm } from './claim-form'

// Demo profile for the preview. Links have no href, so they render as non-interactive rows.
const previewSocials = [
  { label: 'Instagram', icon: Camera },
  { label: 'YouTube', icon: SquarePlay },
  { label: 'Email', icon: Mail },
]

const previewLinks = [
  { title: 'Spring kiln drop', variant: 'accent' as const, thumbIcon: ShoppingBag },
  { title: 'Studio newsletter' },
  { title: 'Book a wheel class' },
  { title: 'Watch me glaze' },
]

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-olive-700 px-[clamp(20px,4vw,24px)] pt-[clamp(128px,14vw,168px)] pb-[clamp(72px,9vw,112px)] text-cream-50"
    >
      <div className="mx-auto grid max-w-container grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(48px,6vw,72px)]">
        <div className="flex flex-col gap-6">
          <h1
            id="hero-heading"
            className="m-0 font-display text-[clamp(44px,7vw,76px)] leading-[0.98] font-extrabold tracking-display text-balance"
          >
            One link for everything you make.
          </h1>
          <p className="m-0 max-w-[500px] text-[clamp(17px,1.6vw,19px)] leading-[1.5] text-pretty text-sand-300">
            Put your shop, your newsletter, your videos and your socials on one page. Share a single
            link in your bio and let people find the rest.
          </p>
          <ClaimForm cta="Claim your link" />
          <p className="m-0 text-[14px] text-olive-300">Free forever. No card needed.</p>
        </div>
        <div className="flex justify-center py-2" aria-hidden="true">
          <div className="max-w-full motion-safe:rotate-2">
            <ProfileCard
              width={320}
              name="Mara Okafor"
              handle="mara.makes"
              bio="Hand-thrown ceramics from a small studio in Lisbon."
              socials={previewSocials}
              links={previewLinks}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
