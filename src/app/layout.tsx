import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Baqqala Grocery — Management & Platform',
    template: '%s | Baqqala Grocery',
  },
  description:
    'Comprehensive Grocery Operating System & Customer Platform for Baqqala Grocery, Zone 19, Abu Dhabi.',
  keywords: [
    'Baqqala Grocery',
    'Abu Dhabi Grocery',
    'Zone 19 Grocery Delivery',
    'Grocery Management System',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  )
}
