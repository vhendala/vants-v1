"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUp, ArrowDown, Receipt, Inbox, X, Copy, ExternalLink, CheckCircle2, ArrowLeft } from "lucide-react"
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

function TxRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const isInitialDeposit = tx.amount === "10000.00" && (tx.type === "DEPOSIT" || tx.description?.includes("Depósito PIX"))
  const isPositive = tx.type === "DEPOSIT" || tx.type === "YIELD" || isInitialDeposit
  const amountColor = isPositive ? "var(--vants-green)" : "var(--vants-ink)"
  const sign = isPositive ? "+" : "−"

  // Normalização da descrição
  let displayDescription = tx.description || tx.type
  if (displayDescription.includes("Depósito PIX")) {
    displayDescription = "Depósito PIX"
  }

  const formattedAmount = parseFloat(tx.amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Formatação de data
  const dateObj = new Date(tx.createdAt)
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const statusStr = tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase()
  const subtitle = `${dateStr} · ${statusStr}`

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
      onClick={onClick}
    >
      <TxIcon type={tx.type} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: "var(--vants-ink)" }}>
          {displayDescription}
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

// ─── Tela de Detalhes da Transação ──────────────────────────────────────────────

function TransactionDetailsView({
  tx,
  isOpen,
  onClose,
  userPublicKey,
}: {
  tx: Transaction | null
  isOpen: boolean
  onClose: () => void
  userPublicKey?: string
}) {
  const { t } = useLanguage()
  
  if (!isOpen || !tx) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const truncateKey = (key?: string) => {
    if (!key) return "N/A"
    if (key.length <= 12) return key
    return `${key.slice(0, 6)}...${key.slice(-4)}`
  }

  const isInitialDeposit =
    tx.amount === "10000.00" &&
    (tx.type === "DEPOSIT" || tx.description?.includes("Depósito PIX"))
  const isPositive = tx.type === "DEPOSIT" || tx.type === "YIELD" || isInitialDeposit
  const sign = isPositive ? "+" : "−"
  const amountColor = isPositive ? "var(--vants-green)" : "var(--vants-ink)"

  const formattedAmount = parseFloat(tx.amount).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateObj = new Date(tx.createdAt)
  const dateStr = dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const timeStr = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Identificação de origem e destino completas e truncadas
  let fullSourceAccount = ""
  let fullDestinationAccount = ""

  if (isInitialDeposit) {
    // Chave real do Sponsor/Emissor de USDC
    fullSourceAccount = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY || "GCIZ3SGJDUYGA6D6XGSBT6XZ253Q77Y7RCYODLWPOJL4C6WDIXRPTZIM"
    fullDestinationAccount = userPublicKey || ""
  } else if (tx.type === "PAYMENT") {
    fullSourceAccount = userPublicKey || ""
    const match = tx.description?.match(/Transferência para (.*)/)
    if (match) {
      fullDestinationAccount = match[1].trim()
    } else {
      fullDestinationAccount = ""
    }
  } else if (tx.type === "DEPOSIT") {
    fullSourceAccount = ""
    fullDestinationAccount = userPublicKey || ""
  }

  const displaySource = fullSourceAccount ? truncateKey(fullSourceAccount) : "Origem Externa"
  const displayDestination = fullDestinationAccount ? truncateKey(fullDestinationAccount) : "Destino Desconhecido"

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-slate-50">
      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen flex flex-col font-sans animate-in slide-in-from-right duration-300 overflow-y-auto pb-10">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 mb-2">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            style={{ color: "var(--vants-ink)" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        <span className="text-[15px] font-bold" style={{ color: "var(--vants-ink)" }}>{t("recentActivity")}</span>
          <div className="w-10" />
        </header>

        {/* Main Content */}
        <main className="px-5 flex flex-col gap-6 mt-4">
          
          {/* Valor do Pagamento */}
          <div className="text-center px-4 mb-2">
            <div className="flex justify-center mb-5">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isPositive ? 'bg-[#ECFDF5]' : 'bg-slate-200/50'}`}>
                {isPositive ? (
                  <ArrowDown className="h-8 w-8 text-[#10B981]" />
                ) : (
                  <ArrowUp className="h-8 w-8 text-slate-700" />
                )}
              </div>
            </div>
            <p className="text-[14px] font-medium text-slate-500 uppercase tracking-widest mb-3">
              {tx.description || (isPositive ? "Recebido" : "Enviado")}
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[40px] font-extrabold leading-none tracking-tight" style={{ color: amountColor }}>
                {sign}{formattedAmount}
              </span>
              <span className="text-[18px] font-bold text-slate-500 ml-1">{tx.asset}</span>
            </div>
          </div>

          {/* Card de Detalhes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-5">
            
            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-medium text-slate-500">Status</span>
              <div className="flex items-center gap-1.5 bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#D1FAE5]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                <span className="text-[13px] font-semibold text-[#10B981] uppercase tracking-wide">
                  Concluído
                </span>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-medium text-slate-500">Data e Hora</span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--vants-ink)" }}>
                {dateStr} às {timeStr}
              </span>
            </div>

            <div className="h-px w-full bg-slate-100 my-1"></div>

            {/* Origem */}
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-medium text-slate-500">Origem</span>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="text-[14px] font-semibold font-mono" style={{ color: "var(--vants-ink)" }}>
                  {displaySource}
                </span>
                {fullSourceAccount && (
                  <button 
                    onClick={() => handleCopy(fullSourceAccount)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/50 transition-colors"
                    style={{ ['--tw-text-opacity' as any]: undefined }}
                    title="Copiar Origem"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Destino */}
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-medium text-slate-500">Destino</span>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="text-[14px] font-semibold font-mono" style={{ color: "var(--vants-ink)" }}>
                  {displayDestination}
                </span>
                {fullDestinationAccount && (
                  <button 
                    onClick={() => handleCopy(fullDestinationAccount)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/50 transition-colors"
                    title="Copiar Destino"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 my-1"></div>

            {/* Hash */}
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-medium text-slate-500">ID da Transação (Stellar)</span>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="text-[13px] font-semibold font-mono truncate mr-2" style={{ color: "var(--vants-ink)" }}>
                  {tx.txHash ? `${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-8)}` : "N/A"}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button 
                    onClick={() => handleCopy(tx.txHash)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                    title="Copiar Hash"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/50 transition-colors"
                    title="Ver no Stellar Expert"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function RecentActivity({ 
  showFilters = false, 
  publicKey,
  onSeeAll
}: { 
  showFilters?: boolean; 
  publicKey?: string;
  onSeeAll?: () => void;
}) {
  const { t } = useLanguage()
  const filters = [t("all"), t("payments"), t("deposits"), t("withdrawals"), t("returns")]
  const [activeFilter, setActiveFilter] = useState(t("all"))
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getAccessToken, authenticated } = usePrivy()
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const handleCloseModal = () => setSelectedTx(null)

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

  // Filtragem no client-side
  const filteredTransactions = transactions.filter((tx) => {
    if (tx.asset === "XLM") return false

    if (activeFilter === t("all")) return true
    if (activeFilter === t("payments") && tx.type === "PAYMENT") return true
    if (activeFilter === t("deposits") && tx.type === "DEPOSIT") return true
    if (activeFilter === t("withdrawals") && tx.type === "WITHDRAWAL") return true
    if (activeFilter === t("returns") && tx.type === "YIELD") return true
    return false
  })

  if (!showFilters) {
    // VISÃO DE WIDGET (HOME)
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: "var(--vants-ink)" }}>{t("recentActivity")}</h2>
          <button 
            onClick={onSeeAll}
            className="text-[13px] font-medium" 
            style={{ color: "var(--vants-blue)" }}
          >
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
            filteredTransactions.slice(0, 5).map((tx) => (
              <TxRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
        <TransactionDetailsView tx={selectedTx} isOpen={!!selectedTx} onClose={handleCloseModal} userPublicKey={publicKey} />
      </section>
    )
  }

  // VISÃO COMPLETA (TELA DE ACTIVITY)
  return (
    <main className="bg-slate-50 min-h-screen pb-28">
      {/* Título */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-bold" style={{ color: "var(--vants-ink)" }}>{t("activity")}</h1>
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
                backgroundColor: isActive ? "var(--vants-blue-deep)" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#64748B",
                borderColor: isActive ? "var(--vants-blue-deep)" : "#E2E8F0",
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
              filteredTransactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>
      <TransactionDetailsView tx={selectedTx} isOpen={!!selectedTx} onClose={handleCloseModal} userPublicKey={publicKey} />
    </main>
  )
}
