'use client'

import { useEffect } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { useTheme } from '@/components/vants/theme-provider'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  // Suppress the Privy "Scam" security console warning
  useEffect(() => {
    const suppressMessage = (originalFn: any) => (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('You are reading this message because you opened the browser console')
      ) {
        return
      }
      originalFn(...args)
    }

    const originalLog = console.log
    const originalWarn = console.warn

    console.log = suppressMessage(originalLog)
    console.warn = suppressMessage(originalWarn)

    return () => {
      console.log = originalLog
      console.warn = originalWarn
    }
  }, [])

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: theme === 'dark' ? '#081329' : 'light',
          accentColor: '#081329',
          showWalletLoginFirst: false,
          walletList: [],
          logo: '/icon.svg',
        },
        // Desativa a criação de wallets embutidas para evitar erros de iframe do Privy
        embeddedWallets: {
          createOnLogin: 'off',
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

