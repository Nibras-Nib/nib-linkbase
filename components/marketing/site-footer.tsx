import { Camera, Mail, SquarePlay } from 'lucide-react'

// Plain text until these pages exist.
const footerColumns = [
  { title: 'Product', items: ['Templates', 'Insights', 'Pricing'] },
  { title: 'Help', items: ['Help center', 'Getting started', 'Contact'] },
  { title: 'Legal', items: ['Privacy', 'Terms', 'Cookies'] },
]

export function SiteFooter() {
  return (
    <footer className="bg-olive-700 px-[clamp(12px,3vw,24px)] pb-[clamp(12px,3vw,24px)]">
      <div className="mx-auto flex max-w-container flex-col gap-6 rounded-xl bg-cream-50 p-[clamp(24px,4vw,40px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-8">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="font-display text-[26px] font-extrabold tracking-wordmark text-ink-900">
              linkbase
            </div>
            <p className="m-0 max-w-[280px] text-[15px] leading-[1.5] text-fg-secondary">
              One link for everything you make.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <h2 className="m-0 text-[15px] font-bold text-ink-900">{column.title}</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {column.items.map((item) => (
                  <li key={item} className="text-[14px] text-fg-secondary">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-line-subtle pt-5 text-[13px] text-fg-muted">
          <span>© 2026 Linkbase</span>
          <div className="flex gap-3 text-fg-secondary" aria-hidden="true">
            <Camera size={18} />
            <SquarePlay size={18} />
            <Mail size={18} />
          </div>
        </div>
      </div>
    </footer>
  )
}
