'use client'

import { PrivyProvider } from '@privy-io/react-auth'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Apenas email/social — sem carteiras externas visíveis ao usuário.
        // Isso garante que o fluxo pareça um banco digital, não uma dApp.
        loginMethods: ['email', 'google', 'apple'],
        appearance: {
          theme: 'light',
          accentColor: '#6851FF', // Vants Indigo
          showWalletLoginFirst: false,
          // Logo e nome reforçam identidade de marca, não de crypto
          logo: '/icon.svg',
        },
        // Embedded wallets são criadas silenciosamente, sem expor ao usuário
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
