import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/layout/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
  },
  title: "Advisorly | Compliance Software for Financial Institutions",
  description:
    "Compliance software for banks and regulated financial institutions in Andorra. Manage regulatory obligations, evidence, KYC reviews, and audit readiness with Advisorly.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}