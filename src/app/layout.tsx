import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Baqqala Grocery — Zone 19, Abu Dhabi',
    template: '%s | Baqqala Grocery',
  },
  description:
    'Fresh local grocery delivery platform for Baqqala Grocery, Zone 19, Abu Dhabi, United Arab Emirates.',
  keywords: [
    'Baqqala Grocery',
    'Abu Dhabi Grocery',
    'Zone 19 Grocery Delivery',
    'Fresh Groceries Abu Dhabi',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  )
}
