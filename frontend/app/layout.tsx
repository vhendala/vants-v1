import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google'

import { PrivyProviderWrapper } from '@/components/providers/PrivyProviderWrapper'
import { ThemeProvider } from '@/components/vants/theme-provider'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import './globals.css'

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope',
})

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Vants',
  description: 'Earn yield on your digital assets with Vants',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0A3F73' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <ThemeProvider>
            <PrivyProviderWrapper>
              {children}
            </PrivyProviderWrapper>
          </ThemeProvider>
        </LanguageProvider>

      </body>
    </html>
  )
}
