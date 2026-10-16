import { ClaimForm } from './claim-form'

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-olive-700 px-[clamp(20px,4vw,24px)] py-[clamp(72px,9vw,104px)] text-cream-50"
    >
      <div className="mx-auto flex max-w-container flex-col items-center gap-7 text-center">
        <h2
          id="final-cta-heading"
          className="m-0 max-w-[760px] font-display text-[clamp(38px,6vw,60px)] leading-none font-extrabold tracking-display text-balance"
        >
          Your corner of the internet, in one link.
        </h2>
        <ClaimForm cta="Claim it" />
        <p className="m-0 text-[14px] text-olive-300">Free forever. No card needed.</p>
      </div>
    </section>
  )
}
