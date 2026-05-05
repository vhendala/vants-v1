"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, Receipt, Inbox } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useLanguage } from "../providers/LanguageProvider"
import { API_URL } from "../../lib/config"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  type: "DEPOSIT" | "PAYMENT" | "YIELD" | "WITHDRAWAL"
  amount: string
  asset: string
  status: string
  description: string
  createdAt: string
  txHash: string
}

// ─── Componentes Visuais ──────────────────────────────────────────────────────

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "DEPOSIT" || type === "YIELD") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 bg-[#ECFDF5]">
        <ArrowDown className="h-4 w-4 text-[#10B981]" />
      </div>
    )
  }
  
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0 bg-slate-100">
      <ArrowUp className="h-4 w-4 text-slate-700" />
    </div>
  )
}

function TxRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.type === "DEPOSIT" || tx.type === "YIELD"
  const amountColor = isPositive ? "#10B981" : "#0F1A2C"
  const sign = isPositive ? "+" : "−"

  // Formatação do valor numérico
  const formattedAmount = parseFloat(tx.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Formatação de data "Apr 26 · Completed"
  const dateObj = new Date(tx.createdAt)
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const statusStr = tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase()
  const subtitle = `${dateStr} · ${statusStr}`

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <TxIcon type={tx.type} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#0F1A2C] leading-tight truncate">
          {tx.description || tx.type}
        </p>
        <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="text-[15px] font-bold"
          style={{ color: amountColor }}
        >
          {sign}{formattedAmount} {tx.asset}
        </span>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
      </div>
      <div className="h-5 bg-slate-200 rounded w-20" />
    </div>
  )
}

function EmptyState() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-[15px] font-semibold text-slate-700">{t("noTransactions")}</p>
      <p className="text-[13px] text-slate-500 mt-1">
        {t("transactionsAppearHere")}
      </p>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function RecentActivity({ showFilters = false }: { showFilters?: boolean }) {
  const { t } = useLanguage()
  const filters = [t("all"), "Payments", "Deposits", "Withdrawals", "Returns"]
  const [activeFilter, setActiveFilter] = useState(t("all"))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getAccessToken, authenticated } = usePrivy()

  const fetchTransactions = useCallback(async () => {
    if (!authenticated) return

    setIsLoading(true)
    try {
      const token = await getAccessToken()
      const limitQuery = showFilters ? "" : "?limit=5"
      const res = await fetch(`${API_URL}/api/transactions/history${limitQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, authenticated, showFilters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filtragem no client-side para a tela de Activity (opcional, pode ser movido para o backend)
  const filteredTransactions = transactions.filter((tx) => {
    // WHY: Oculta transações de ativação/fomento interno em XLM
    if (tx.asset === "XLM") return false

    if (activeFilter === t("all")) return true
    if (activeFilter === "Payments" && tx.type === "PAYMENT") return true
    if (activeFilter === "Deposits" && tx.type === "DEPOSIT") return true
    if (activeFilter === "Withdrawals" && tx.type === "WITHDRAWAL") return true
    if (activeFilter === "Returns" && tx.type === "YIELD") return true
    return false
  })

  if (!showFilters) {
    // VISÃO DE WIDGET (HOME)
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-[#0F1A2C]">{t("recentActivity")}</h2>
          <button className="text-[13px] font-medium" style={{ color: "#6366F1" }}>
            {t("all")}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.slice(0, 5).map((tx) => <TxRow key={tx.id} tx={tx} />)
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    )
  }

  // VISÃO COMPLETA (TELA DE ACTIVITY)
  return (
    <main className="bg-slate-50 min-h-screen pb-28">
      {/* Título */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold text-[#0F1A2C]">Activity</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-5 pb-6 overflow-x-auto scrollbar-hide">
        {filters.map((f) => {
          const isActive = f === activeFilter
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[14px] font-medium border transition-colors"
              style={{
                backgroundColor: isActive ? "#0F1A2C" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#64748B",
                borderColor: isActive ? "#0F1A2C" : "#E2E8F0",
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Lista de Transações */}
      <div className="flex flex-col gap-6 px-5">
        <section>
          <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => <TxRow key={tx.id} tx={tx} />)
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
