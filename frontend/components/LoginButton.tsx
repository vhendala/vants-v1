'use client'

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { LogOut, User } from 'lucide-react'

// Extrai o identificador amigável do usuário: primeiro trecho do email ou nome.
function resolveDisplayName(user: ReturnType<typeof usePrivy>['user']): string {
  if (!user) return ''
  if (user.email?.address) {
    return user.email.address.split('@')[0]
  }
  if (user.google?.name) return user.google.name.split(' ')[0]
  if (user.apple?.email) return user.apple.email.split('@')[0]
  return 'Conta'
}

export function LoginButton() {
  const router = useRouter()
  const { ready, authenticated, login, logout, user } = usePrivy()

  // Handle logout with proper async flow
  const handleLogout = async () => {
    try {
      console.log('[LoginButton] Starting logout...')
      
      // IMPORTANT: Must await logout() to ensure Privy completely clears the session
      // cookies, localStorage, and all authentication state
      await logout()
      
      console.log('[LoginButton] Logout complete, redirecting to home...')
      
      // AFTER logout promise resolves, redirect to home page
      // This ensures Privy state is fully cleared before the page transitions
      router.push('/')
    } catch (error) {
      console.error('[LoginButton] Logout error:', error)
      // Redirect anyway to allow user to recover
      router.push('/')
    }
  }

  // Estado de loading — evita layout shift enquanto o SDK inicializa
  if (!ready) {
    return (
      <div
        aria-busy="true"
        aria-label="Carregando autenticação"
        className="h-9 w-24 animate-pulse rounded-lg bg-slate-200"
      />
    )
  }

  if (authenticated) {
    const displayName = resolveDisplayName(user)

    return (
      <div className="flex items-center gap-3">
        {/* Indicador de perfil */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6851FF]">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="max-w-[120px] truncate font-sans text-sm font-medium text-[#081229]">
            {displayName}
          </span>
        </div>

        {/* Sign out — ghost button discreto */}
        <button
          id="vants-signout-btn"
          onClick={handleLogout}
          title="Sair da conta"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-[#081229]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    )
  }

  // Estado deslogado — CTA principal em Vants Indigo
  return (
    <button
      id="vants-login-btn"
      onClick={login}
      className="rounded-lg bg-[#6851FF] px-5 py-2 font-sans text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-indigo-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6851FF] focus-visible:ring-offset-2 active:scale-[0.98]"
    >
      Entrar
    </button>
  )
}
