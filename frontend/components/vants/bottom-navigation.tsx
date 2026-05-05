"use client"

import { Home, TrendingUp, Activity, User } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

// WHY: A navegação inferior tem 5 itens conforme o design de referência:
// Home | Invest | [QR central elevado] | Activity | Profile
type View = "home" | "invest" | "wallet" | "activity" | "profile"

interface BottomNavigationProps {
  activeView: View
  onViewChange: (view: View) => void
}

// Ícone de QR/Scan em SVG inline
function QrIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h3v3h-3z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function NavButton({
  item,
  isActive,
  onViewChange,
}: {
  item: { id: View; icon: React.ElementType; label: string }
  isActive: boolean
  onViewChange: (view: View) => void
}) {
  return (
    <button
      key={item.id}
      onClick={() => onViewChange(item.id)}
      className="flex flex-col items-center gap-1 px-3 py-2 transition-colors"
    >
      <item.icon
        className="h-6 w-6 transition-colors"
        style={{ color: isActive ? "#6366F1" : "#94A3B8" }}
        strokeWidth={isActive ? 2.5 : 1.8}
      />
      <span
        className="text-[10px] font-medium uppercase tracking-tight"
        style={{ color: isActive ? "#6366F1" : "#94A3B8" }}
      >
        {item.label}
      </span>
    </button>
  )
}

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const { t } = useLanguage()

  const leftItems = [
    { id: "home" as const, icon: Home, label: t("home") },
    { id: "invest" as const, icon: TrendingUp, label: t("invest") },
  ]

  const rightItems = [
    { id: "activity" as const, icon: Activity, label: t("activity") },
    { id: "profile" as const, icon: User, label: t("profile") },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 safe-bottom">
      <div className="mx-auto max-w-md">
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {/* Esquerda */}
          {leftItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onViewChange={onViewChange}
            />
          ))}

          {/* Botão central QR — elevado e maior */}
          <div className="flex flex-col items-center" style={{ marginTop: -20 }}>
            <button
              onClick={() => onViewChange("wallet" as View)}
              className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: "#0F1A2C" }}
              aria-label="Scan QR"
            >
              <QrIcon />
            </button>
            <span className="text-[10px] font-medium uppercase mt-1 text-[#94A3B8] tracking-tight">
              {t("wallet")}
            </span>
          </div>

          {/* Direita */}
          {rightItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onViewChange={onViewChange}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
