// sites/rxlens/src/app/layout.tsx

import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'

import '@/app/globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RxLens - Client-Side Pharmacogenomics Report Generator',
  description:
    'Generate a clinician-ready pharmacogenomics summary from a 23andMe raw data file, entirely in-browser.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.className} antialiased`}>{children}</body>
    </html>
  )
}
