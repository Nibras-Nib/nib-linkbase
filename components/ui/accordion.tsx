'use client'

import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

export type AccordionItem = {
  question: string
  answer: string
}

type AccordionProps = {
  items: AccordionItem[]
  tone?: 'light' | 'dark'
  single?: boolean
  defaultOpen?: number
}

export function Accordion({ items, tone = 'light', single = true, defaultOpen = -1 }: AccordionProps) {
  const baseId = useId()
  const [open, setOpen] = useState<number[]>(defaultOpen >= 0 ? [defaultOpen] : [])

  function toggle(index: number) {
    setOpen((current) => {
      if (current.includes(index)) return current.filter((i) => i !== index)
      return single ? [index] : [...current, index]
    })
  }

  const isDark = tone === 'dark'

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, index) => {
        const isOpen = open.includes(index)
        const headId = `${baseId}-head-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div
            key={item.question}
            className={`overflow-hidden rounded-lg font-sans ${isDark ? 'bg-[rgba(251,247,240,.08)] text-cream-50' : 'bg-white text-fg-primary'}`}
          >
            <h3 className="m-0">
              <button
                type="button"
                id={headId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className={`flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-6 py-5 text-left text-[17px] leading-[1.3] font-semibold text-inherit focus-visible:shadow-focus focus-visible:outline-none ${isDark ? 'hover:bg-[rgba(251,247,240,.06)]' : 'hover:bg-overlay-hover'}`}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                  className={`flex-none transition-transform duration-200 ease-brand ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headId}
              hidden={!isOpen}
              className={`px-6 pb-[22px] text-[16px] leading-[1.55] ${isDark ? 'text-sand-300' : 'text-fg-secondary'}`}
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
