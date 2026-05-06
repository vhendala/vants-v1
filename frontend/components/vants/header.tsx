"use client"

import { useRouter } from "next/navigation"
import { Bell, LogOut } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useLanguage } from "../providers/LanguageProvider"
import { LanguageSelector } from "../providers/LanguageSelector"

export function Header() {
  const { t } = useLanguage()
  const router = useRouter()
  const { logout } = usePrivy()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch {
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
      {/* Logo — Deep Navy, bold, letter-spaced */}
      <span
        className="text-base font-extrabold tracking-[0.18em] select-none"
        style={{ color: "#0F1A2C" }}
      >
        VANTS
      </span>

      <div className="flex items-center gap-2">
        {/* Sino de notificação com badge */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label={t("notifications")}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        <LanguageSelector />

        {/* Botão de Sair — Cinza slate-500, combinando com o sino */}
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label={t("logout")}
          title={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
