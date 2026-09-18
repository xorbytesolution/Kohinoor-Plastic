import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kohinoor Plastic — Bottles & Drinkware',
  description: 'Precision-made bottles and drinkware for everyday life, retail, gifting and beyond.',
  generator: 'v0.app',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f4f1eb' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
