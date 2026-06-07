"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"
import * as StellarSdk from "@stellar/stellar-sdk"

const ISSUER_PUBLIC_KEY = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
const TESOURO_ISSUER_PUBLIC_KEY = process.env.NEXT_PUBLIC_TESOURO_ISSUER_PUBLIC_KEY || "GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4"
const HORIZON_URL = "https://horizon-testnet.stellar.org"

interface BalanceCardProps {
  publicKey: string
  refreshKey?: number
  initialUsdc?: number | null
  initialTesouro?: number | null
  initialInvested?: number | null
  initialRate?: number
}

type Currency = "USD" | "BRL"

// Mini linha chart SVG decorativa dentro do card navy
function BalanceChart() {
  return (
    <svg viewBox="0 0 200 40" className="w-full h-10" preserveAspectRatio="none">
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

function CurrencyToggle({ active, onToggle }: { active: Currency; onToggle: (c: Currency) => void }) {
  return (
    <div className="flex bg-white/10 p-1 rounded-full backdrop-blur-sm">
      <button
        onClick={() => onToggle("USD")}
        className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
          active === "USD" ? "bg-white text-[var(--vants-blue-deep)] shadow-sm" : "text-white/60 hover:text-white"
        }`}
      >
        USD
      </button>
      <button
        onClick={() => onToggle("BRL")}
        className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all ${
          active === "BRL" ? "bg-white text-[var(--vants-blue-deep)] shadow-sm" : "text-white/60 hover:text-white"
        }`}
      >
        BRL
      </button>
    </div>
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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD")

  // 3. Cálculo de Conversão
  // USDC é 1:1 com USD. Para BRL usamos taxa real. "XLM" no seletor exibe USDC.
  const getFormattedBalance = () => {
    // Se ainda não carregou nada do Dashboard, mostra skeleton
    if (initialUsdc === null || initialTesouro === null) return { symbol: "", value: "..." }

    let value = 0
    let symbol = ""

    switch (selectedCurrency) {
      case "USD":
        // USDC é 1:1 USD, TESOURO convertido via taxa inversa, + Investido em USD
        value = initialUsdc + (initialRate > 0 ? initialTesouro / initialRate : 0) + (initialInvested || 0)
        symbol = "$"
        break
      case "BRL":
        // TESOURO é 1:1 BRL, USDC convertido via taxa, + Investido em BRL
        value = (initialUsdc * initialRate) + initialTesouro + ((initialInvested || 0) * initialRate)
        symbol = "R$"
        break
    }

    const formattedValue = value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return {
      symbol,
      value: formattedValue
    }
  }

  const { symbol, value } = getFormattedBalance()

  const getFormattedInvested = () => {
    if (initialInvested === null) return "..."
    const val = selectedCurrency === "USD" ? initialInvested : initialInvested * initialRate
    const sym = selectedCurrency === "USD" ? "$" : "R$"
    return `${sym} ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // 4. Atualização da UI
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
        {/* Cabeçalho do Card: Label e Toggle de Moedas */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-white/50">{t("totalBalance")}</p>
          
          {/* Seletor Minimalista de Moeda (Pill) */}
          <div className="flex bg-black/20 rounded-full p-1 border border-white/5">
            {(["USD", "BRL"] as Currency[]).map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                  selectedCurrency === currency
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>

        {/* Valor Principal Animado */}
        <div className="mb-4 h-12 flex items-center">
          {initialUsdc === null ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
              <span className="text-white/50 text-sm font-medium">{t("syncing")}</span>
            </div>
          ) : (
            <p className="text-[42px] font-bold tracking-tight leading-none animate-in fade-in slide-in-from-bottom-2 duration-500" key={selectedCurrency}>
              {symbol && (
                <span className="text-[22px] align-top mt-2 inline-block font-medium opacity-70 mr-1">
                  {symbol}
                </span>
              )}
              {value}
            </p>
          )}
        </div>

        {/* INVESTED / ACCOUNT */}
        <div
          className="flex items-start gap-6 border-t pb-4 pt-4 mb-4"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">
              {t("invested")}
            </p>
            <p className="text-[15px] font-bold text-white/80">
              {getFormattedInvested()}
            </p>
          </div>
          <div
            className="w-px h-10 self-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">
              {t("account")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="TESOURO">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--vants-green)]" />
                <p className="text-[14px] font-bold text-white">
                  {initialUsdc === null ? "..." : `R$ ${initialTesouro?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5" title="USDC">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--vants-blue-light)]" />
                <p className="text-[14px] font-bold text-white">
                  {initialUsdc === null ? "..." : `$ ${initialUsdc?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge de ganho mensal — verde semântico */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: "oklch(74% 0.13 155 / 0.2)", color: "var(--vants-green)" }}
          >
            ▲ +$0.00 (+0.00%)
          </span>
          <span className="text-[13px] text-white/40">{t("thisMonth")}</span>
        </div>

        {/* Mini chart */}
        <BalanceChart />
      </div>
    </div>
  )
}
