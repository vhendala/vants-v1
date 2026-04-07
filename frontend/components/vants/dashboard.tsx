"use client"

import { useState } from "react"
import { Header } from "./header"
import { BalanceCard } from "./balance-card"
import { QuickActions } from "./quick-actions"
import { InvestmentPools } from "./investment-pools"
import { RecentActivity } from "./recent-activity"
import { BottomNavigation } from "./bottom-navigation"
import { InvestmentsView } from "./investments-view"
import { PaymentView } from "./payment-view"
import { WalletView } from "./wallet-view"

type View = "home" | "wallet" | "yield" | "profile" | "invest"

export function VantsDashboard() {
  const [activeView, setActiveView] = useState<View>("home")
  const [showPayment, setShowPayment] = useState(false)

  if (showPayment) {
    return <PaymentView onBack={() => setShowPayment(false)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-md md:max-w-5xl md:flex md:gap-8 pb-32 md:pb-8 pt-4">
        
        {/* Nav Lateral no Desktop (Escondido no mobile) */}
        <aside className="hidden md:block w-64 shrink-0 px-4">
          <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
        </aside>

        {/* Célula do Conteúdo */}
        <div className="flex-1 w-full max-w-md md:max-w-full mx-auto md:mx-0 relative">
          <Header />
        
        {activeView === "home" && (
          <main className="px-4 py-4 flex flex-col gap-6">
            <BalanceCard />
            <QuickActions onPayBill={() => setShowPayment(true)} />
            <InvestmentPools />
            <RecentActivity />
          </main>
        )}

        {activeView === "invest" && (
          <InvestmentsView />
        )}

        {activeView === "wallet" && (
          <WalletView onPayBill={() => setShowPayment(true)} />
        )}

        {activeView === "yield" && (
          <main className="px-4 py-4">
            <div className="flex h-64 items-center justify-center rounded-xl bg-card border border-border">
              <p className="text-muted-foreground font-semibold">Markets View</p>
            </div>
          </main>
        )}

        {activeView === "profile" && (
          <main className="px-4 py-4">
            <div className="flex h-64 items-center justify-center rounded-xl bg-card border border-border">
              <p className="text-muted-foreground font-semibold">Settings View</p>
            </div>
          </main>
        )}

        {/* Nav Inferior no Mobile (Escondido no desktop) */}
        <div className="md:hidden">
          <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
        </div>
        </div>
      </div>
    </div>
  )
}
