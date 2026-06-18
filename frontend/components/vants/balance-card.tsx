"use client"

import { Loader2, TrendingUp } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

interface BalanceCardProps {
  publicKey: string
  refreshKey?: number
  initialUsdc?: number | null
  initialTesouro?: number | null
  initialInvested?: number | null
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

export function BalanceCard({
  publicKey,
  refreshKey = 0,
  initialUsdc = null,
  initialTesouro = null,
  initialInvested = null,
  initialRate = 5.45
}: BalanceCardProps) {
  const { t } = useLanguage()

  const isLoading = initialUsdc === null || initialTesouro === null

  const brlFormatted = isLoading
    ? "..."
    : (initialTesouro ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const usdFormatted = isLoading
    ? "..."
    : (initialUsdc ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

        {/* Dois sub-cards de saldo */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Card BRL */}
          <div
            className="rounded-2xl px-4 py-3 flex flex-col gap-1"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg leading-none">🇧🇷</span>
              <span className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">
                {t("brlBalance") || "Saldo em Real"}
              </span>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-1.5 h-8">
                <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                <span className="text-white/40 text-xs">{t("syncing")}</span>
              </div>
            ) : (
              <p
                className="font-bold tabular-nums leading-none"
                style={{ fontSize: 22, fontFamily: "'Inter', sans-serif" }}
              >
                <span className="text-[13px] font-medium opacity-60 mr-0.5">R$</span>
                {brlFormatted}
              </p>
            )}
          </div>

          {/* Card USD */}
          <div
            className="rounded-2xl px-4 py-3 flex flex-col gap-1"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg leading-none">🇺🇸</span>
              <span className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">
                {t("usdBalance") || "Saldo em Dólar"}
              </span>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-1.5 h-8">
                <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                <span className="text-white/40 text-xs">{t("syncing")}</span>
              </div>
            ) : (
              <p
                className="font-bold tabular-nums leading-none"
                style={{ fontSize: 22, fontFamily: "'Inter', sans-serif" }}
              >
                <span className="text-[13px] font-medium opacity-60 mr-0.5">$</span>
                {usdFormatted}
              </p>
            )}
          </div>
        </div>

        <div className="h-px w-full mb-4" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

        {/* Mini chart */}
        <BalanceChart />
      </div>
    </div>
  )
}
