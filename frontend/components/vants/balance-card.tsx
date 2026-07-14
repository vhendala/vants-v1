"use client"

import { Loader2, TrendingUp } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

interface BalanceCardProps {
  publicKey: string
  refreshKey?: number
  initialUsdc?: number | null
  initialTesouro?: number | null
  initialXlm?: number | null
  initialRate?: number
}

// Mini linha chart SVG decorativa dentro do card navy
function BalanceChart() {
  return (
    <svg viewBox="0 0 200 40" className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points="0,36 20,34 40,33 55,32 70,30 90,28 110,24 130,20 150,16 165,12 180,9 200,4"
        fill="none"
        stroke="var(--vants-green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle cx="200" cy="4" r="3.5" fill="var(--vants-green)" />
    </svg>
  )
}

// Sub-card individual de saldo
function BalanceSubCard({
  flag,
  label,
  prefix,
  value,
  isLoading,
  syncText,
}: {
  flag: string
  label: string
  prefix: string
  value: string
  isLoading: boolean
  syncText: string
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl px-3 py-2.5 flex flex-col gap-0.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-sm leading-none">{flag}</span>
        <span className="text-[9px] font-bold text-white/50 tracking-wide uppercase truncate">
          {label}
        </span>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-1 h-6">
          <Loader2 className="h-3 w-3 text-white/40 animate-spin" />
          <span className="text-white/40 text-[10px]">{syncText}</span>
        </div>
      ) : (
        <p
          className="font-bold tabular-nums leading-none truncate"
          style={{ fontSize: 16, fontFamily: "'Inter', sans-serif" }}
        >
          <span className="text-[10px] font-medium opacity-60 mr-0.5">{prefix}</span>
          {value}
        </p>
      )}
    </div>
  )
}

export function BalanceCard({
  publicKey,
  refreshKey = 0,
  initialUsdc = null,
  initialTesouro = null,
  initialXlm = null,
  initialRate = 5.45,
}: BalanceCardProps) {
  const { t } = useLanguage()

  const isLoading = initialUsdc === null || initialTesouro === null || initialXlm === null

  const brlFormatted = isLoading
    ? "..."
    : (initialTesouro ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const usdFormatted = isLoading
    ? "..."
    : (initialUsdc ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const xlmFormatted = isLoading
    ? "..."
    : (initialXlm ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })

  const syncText = t("syncing") || "Sincronizando"

  return (
    <div
      className="relative overflow-hidden rounded-[24px] text-white"
      style={{ backgroundColor: "var(--vants-hero-bg)" }}
    >
      {/* Efeito radial decorativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, oklch(56% 0.13 218 / 0.15) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 px-5 pt-5 pb-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-white/50">{t("totalBalance")}</p>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: "oklch(74% 0.13 155 / 0.2)", color: "var(--vants-green)" }}
          >
            <TrendingUp className="h-3 w-3" />
            +0.00%
          </span>
        </div>

        {/* Três sub-cards de saldo — mesma linha, sem scroll */}
        <div className="flex gap-2 mb-4">
          <BalanceSubCard
            flag="🇧🇷"
            label={t("brlBalance") || "Real"}
            prefix="R$"
            value={brlFormatted}
            isLoading={isLoading}
            syncText={syncText}
          />
          <BalanceSubCard
            flag="🇺🇸"
            label={t("usdBalance") || "USD"}
            prefix="$"
            value={usdFormatted}
            isLoading={isLoading}
            syncText={syncText}
          />
          <BalanceSubCard
            flag="✶"
            label="XLM"
            prefix=""
            value={xlmFormatted}
            isLoading={isLoading}
            syncText={syncText}
          />
        </div>

        <div className="h-px w-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

        {/* Mini chart */}
        <BalanceChart />
      </div>
    </div>
  )
}
