import { ChartNoAxesColumn, Smartphone, Timer } from 'lucide-react'

const reasons = [
  {
    icon: Timer,
    title: 'Set up in a few minutes.',
    body: 'Pick a name, add your links and choose a theme. There is no hosting or code to deal with.',
  },
  {
    icon: Smartphone,
    title: 'Made for phones.',
    body: 'Your page loads fast and looks right inside the in-app browsers people open it from.',
  },
  {
    icon: ChartNoAxesColumn,
    title: 'See which links people click.',
    body: 'Linkbase counts views and clicks for each link, so you know what to keep at the top.',
  },
]

export function Reasons() {
  return (
    <section
      id="features"
      aria-label="Why Linkbase"
      className="scroll-mt-24 bg-cream-100 px-[clamp(20px,4vw,24px)] py-[clamp(64px,7vw,88px)] text-fg-primary"
    >
      <div className="mx-auto grid max-w-container grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-[clamp(32px,4vw,48px)]">
        {reasons.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-clay-100 text-clay-600">
              <Icon size={24} aria-hidden="true" />
            </div>
            <h2 className="m-0 text-h3 leading-[1.2]">{title}</h2>
            <p className="m-0 max-w-[360px] text-[16px] leading-[1.5] text-pretty text-fg-secondary">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
