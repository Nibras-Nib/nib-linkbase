import { Accordion, type AccordionItem } from '@/components/ui/accordion'

const faqs: AccordionItem[] = [
  {
    question: 'Is Linkbase free?',
    answer:
      'Yes. The free plan includes unlimited links, a linkbase.me URL and basic insights. Pro adds custom domains and scheduling.',
  },
  {
    question: 'How is this different from a website?',
    answer:
      'A Linkbase page is built for phones and for bios. It takes minutes to set up and you never have to think about hosting.',
  },
  {
    question: 'Can I use my own domain?',
    answer: 'On Pro you can point any domain you own at your Linkbase page.',
  },
  {
    question: 'Can I sell things from my page?',
    answer: 'Link to any shop, or add a product link with a price and image.',
  },
  {
    question: 'How many links can I add?',
    answer: 'As many as you want. Most people keep five to eight visible and hide the rest.',
  },
  {
    question: 'Can I change my username later?',
    answer: 'Yes, from Settings. Your old link redirects for 30 days.',
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 bg-bark-900 px-[clamp(20px,4vw,24px)] py-[clamp(72px,9vw,112px)] text-cream-50"
    >
      <div className="mx-auto flex max-w-[760px] flex-col gap-[clamp(28px,4vw,40px)]">
        <h2
          id="faq-heading"
          className="m-0 text-center font-display text-[clamp(34px,5vw,44px)] leading-none font-extrabold tracking-display text-ochre-300"
        >
          Questions, answered
        </h2>
        <Accordion tone="dark" items={faqs} />
      </div>
    </section>
  )
}
