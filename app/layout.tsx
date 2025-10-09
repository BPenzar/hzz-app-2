import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HZZ-App - Automatska priprema HZZ zahtjeva',
  description: 'Web aplikacija za automatsku pripremu HZZ zahtjeva za samozapošljavanje u Hrvatskoj',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hr">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
