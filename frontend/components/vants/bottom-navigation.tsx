"use client"

import { LayoutGrid, Wallet, TrendingUp, Settings } from "lucide-react"

type View = "home" | "wallet" | "yield" | "profile" | "invest"

interface BottomNavigationProps {
  activeView: View
  onViewChange: (view: View) => void
}

const navItems = [
  { id: "home" as const, icon: LayoutGrid, label: "Visão Geral" },
  { id: "wallet" as const, icon: Wallet, label: "Ativos" },
  { id: "yield" as const, icon: TrendingUp, label: "Mercados" },
  { id: "profile" as const, icon: Settings, label: "Ajustes" },
]

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-around backdrop-blur-xl bg-card/90 border-t border-border px-2 py-2 safe-bottom">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "text-[#6851FF]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Ícone com fundo ativo */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#6851FF]/10 scale-110"
                      : "scale-100"
                  }`}
                >
                  <item.icon
                    className="h-5 w-5 transition-transform duration-200"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {item.label}
                </span>

                {/* Dot indicador ativo */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6851FF]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
