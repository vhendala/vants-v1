"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TxType = "payment" | "yield" | "deposit"

interface Transaction {
  id: number
  title: string
  subtitle: string
  amount: string
  type: TxType
  settled?: boolean
}

interface DateGroup {
  label: string
  transactions: Transaction[]
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const TRANSACTION_GROUPS: DateGroup[] = [
  {
    label: "TODAY",
    transactions: [
      {
        id: 1,
        title: "Paid CFE Electric",
        subtitle: "4:32 PM",
        amount: "−$100.00",
        type: "payment",
        settled: true,
      },
    ],
  },
  {
    label: "YESTERDAY",
    transactions: [
      {
        id: 2,
        title: "Returns earned",
        subtitle: "Core Yield · 11:00 PM",
        amount: "+$0.27",
        type: "yield",
      },
      {
        id: 3,
        title: "Returns earned",
        subtitle: "Balanced · 11:00 PM",
        amount: "+$0.14",
        type: "yield",
      },
    ],
  },
  {
    label: "MARCH 12",
    transactions: [
      {
        id: 4,
        title: "Deposited",
        subtitle: "Core Yield · 2:15 PM",
        amount: "+$500.00",
        type: "deposit",
      },
      {
        id: 5,
        title: "Paid Telmex",
        subtitle: "10:22 AM",
        amount: "−$45.00",
        type: "payment",
        settled: true,
      },
    ],
  },
]

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: "#10B981" }}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="6.34" y1="6.34" x2="17.66" y2="17.66" />
      <line x1="6.34" y1="17.66" x2="17.66" y2="6.34" />
    </svg>
  )
}

function TxIcon({ type }: { type: TxType }) {
  if (type === "yield") {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "#ECFDF5" }}
      >
        <ReturnIcon />
      </div>
    )
  }
  if (type === "deposit") {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "#F5F3FF" }}
      >
        <ArrowDown className="h-4 w-4" style={{ color: "#6366F1" }} />
      </div>
    )
  }
  // payment
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shrink-0">
      <ArrowUp className="h-4 w-4 text-slate-700" />
    </div>
  )
}

function TxRow({ tx }: { tx: Transaction }) {
  let amountColor = "#081329"
  if (tx.type === "yield") amountColor = "#10B981"
  if (tx.type === "deposit") amountColor = "#6366F1"

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <TxIcon type={tx.type} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-slate-900 leading-tight">{tx.title}</p>
        <p className="text-[13px] text-slate-500 mt-0.5">{tx.subtitle}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="text-[15px] font-semibold"
          style={{ color: amountColor }}
        >
          {tx.amount}
        </span>
        {tx.settled && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
          >
            Settled
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Payments", "Deposits", "Withdrawals", "Returns"]

// ─── Componente principal ─────────────────────────────────────────────────────

export function RecentActivity({ showFilters = false }: { showFilters?: boolean }) {
  const [activeFilter, setActiveFilter] = useState("All")

  // Quando usado como widget no Home, renderiza apenas 3 transações sem filtros
  if (!showFilters) {
    const flatTx = TRANSACTION_GROUPS.flatMap((g) => g.transactions).slice(0, 3)
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-slate-900">Recent activity</h2>
          <button className="text-[13px] font-medium" style={{ color: "#6366F1" }}>
            All
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {flatTx.map((tx) => (
            <TxRow key={tx.id} tx={tx} />
          ))}
        </div>
      </section>
    )
  }

  // Tela completa de Activity
  return (
    <main className="bg-slate-50 min-h-screen pb-28">
      {/* Título */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold text-[#081329]">Activity</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-5 pb-6 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = f === activeFilter
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-[14px] font-medium border transition-colors"
              style={{
                backgroundColor: isActive ? "#081329" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#64748B",
                borderColor: isActive ? "#081329" : "#E2E8F0",
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Grupos de transações */}
      <div className="flex flex-col gap-6 px-5">
        {TRANSACTION_GROUPS.map((group) => (
          <section key={group.label}>
            <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-3">
              {group.label}
            </p>
            <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {group.transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
