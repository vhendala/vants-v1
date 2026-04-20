"use client"

import { useRouter } from "next/navigation"
import { Bell, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "./theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePrivy } from "@privy-io/react-auth"

export function Header() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { logout } = usePrivy()

  // Handle logout with proper async flow
  const handleLogout = async () => {
    try {
      console.log('[Header] Starting logout...')
      
      // IMPORTANT: Must await logout() to ensure Privy completely clears the session
      // cookies, localStorage, and all authentication state
      await logout()
      
      console.log('[Header] Logout complete, redirecting to home...')
      
      // AFTER logout promise resolves, redirect to home page
      // This ensures Privy state is fully cleared before the page transitions
      router.push('/')
    } catch (error) {
      console.error('[Header] Logout error:', error)
      // Redirect anyway to allow user to recover
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-xl bg-background/80 border-b border-border">
      {/* Logo com gradiente — assinatura da landing page */}
      <div className="flex items-center">
        <span className="gradient-text text-xl font-bold uppercase tracking-widest select-none">
          VANTS
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl transition-all"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl transition-all relative"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {/* Indicador de notificação */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6851FF]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
          aria-label="Sair"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8 ml-1 ring-2 ring-[#6851FF]/40 ring-offset-1 ring-offset-background">
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback className="bg-[#6851FF]/20 text-[#6851FF] text-xs font-bold">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
