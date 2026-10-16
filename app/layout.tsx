import type { Metadata } from 'next'
import { Commissioner, DM_Mono } from 'next/font/google'

import './globals.css'

const commissioner = Commissioner({
  variable: '--font-commissioner',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Linkbase: one link for everything you make',
  description:
    'Put your shop, your newsletter, your videos and your socials on one page. Share a single link in your bio and let people find the rest.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${commissioner.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page font-sans text-fg-primary">{children}</body>
    </html>
  )
}
