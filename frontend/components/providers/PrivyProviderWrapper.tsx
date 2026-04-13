'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { useTheme } from '@/components/vants/theme-provider'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        appearance: {
          theme: theme === 'dark' ? '#081229' : 'light',
          accentColor: '#6851FF',
          showWalletLoginFirst: false,
          walletList: [],
          logo: '/icon.svg',
        },
        embeddedWallets: {
          createOnLogin: 'never',
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
