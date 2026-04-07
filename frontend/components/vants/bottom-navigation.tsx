"use client"

import { LayoutGrid, Wallet, TrendingUp, Settings } from "lucide-react"

type View = "home" | "wallet" | "yield" | "profile" | "invest"

interface BottomNavigationProps {
  activeView: View
  onViewChange: (view: View) => void
}

const navItems = [
  { id: "home" as const, icon: LayoutGrid, label: "Visão Geral" },
  { id: "wallet" as const, icon: Wallet, label: "Pagar" },
  { id: "yield" as const, icon: TrendingUp, label: "Mercados" },
  { id: "profile" as const, icon: Settings, label: "Ajustes" },
]

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:relative md:z-auto">
      <div className="mx-auto max-w-md md:max-w-none h-full">
        <div className="flex items-center justify-around md:flex-col md:items-start md:justify-start md:gap-2 backdrop-blur-xl bg-card/90 md:bg-transparent border-t border-border md:border-none px-2 md:px-0 py-2 md:py-6 safe-bottom">
          {navItems.map((item) => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex flex-col md:flex-row md:w-full items-center md:justify-start gap-1 md:gap-4 px-5 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "text-primary md:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {/* Ícone com fundo ativo */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 md:bg-transparent scale-110 md:scale-100"
                      : "scale-100"
                  }`}
                >
                  <item.icon
                    className="h-5 w-5 transition-transform duration-200"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest">
                  {item.label}
                </span>

                {/* Dot indicador ativo (mobile apenas) */}
                {isActive && (
                  <span className="md:hidden absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
