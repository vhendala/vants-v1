"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import * as StellarSdk from "@stellar/stellar-sdk"

const ISSUER_PUBLIC_KEY = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? ""
const HORIZON_URL = "https://horizon-testnet.stellar.org"

interface BalanceCardProps {
  publicKey: string
}

type Currency = "USD" | "BRL"

// Mini linha chart SVG decorativa dentro do card navy
function BalanceChart() {
  return (
    <svg viewBox="0 0 200 40" className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points="0,36 20,34 40,33 55,32 70,30 90,28 110,24 130,20 150,16 165,12 180,9 200,4"
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle cx="200" cy="4" r="3.5" fill="#10B981" />
    </svg>
  )
}

export function BalanceCard({ publicKey }: BalanceCardProps) {
  // 1. Gestão de Estados
  // WHY: usdcBalance substitui xlmBalance — com Hi-Li, o saldo relevante é USDC.
  // USDC é 1:1 com USD, então não precisamos de taxa usd. Mantemos brl para conversão.
  const [usdcBalance, setUsdcBalance] = useState<number>(0)
  const [brlRate, setBrlRate] = useState<number>(0)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 2. Busca de Dados
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const server = new StellarSdk.Horizon.Server(HORIZON_URL)

        // Busca saldo USDC e taxa BRL em paralelo
        const [accountResponse, ratesResponse] = await Promise.all([
          server.loadAccount(publicKey).catch(() => null),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=brl")
            .then(res => res.json())
            .catch(() => null)
        ])

        // Lendo saldo USDC exclusivamente (ignora XLM conforme arquitetura Hi-Li)
        let balance = 0
        if (accountResponse && ISSUER_PUBLIC_KEY) {
          const usdcLine = accountResponse.balances.find(
            (b: StellarSdk.Horizon.HorizonApi.BalanceLine) =>
              b.asset_type === "credit_alphanum4" &&
              (b as StellarSdk.Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_code === "USDC" &&
              (b as StellarSdk.Horizon.HorizonApi.BalanceLine<"credit_alphanum4">).asset_issuer === ISSUER_PUBLIC_KEY
          )
          if (usdcLine) balance = parseFloat(usdcLine.balance)
        }
        setUsdcBalance(balance)

        // Taxa USD/BRL via CoinGecko (USDC proxy)
        if (ratesResponse?.["usd-coin"]?.brl) {
          setBrlRate(ratesResponse["usd-coin"].brl)
        }
      } catch (error) {
        console.error("Erro ao buscar saldo USDC:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (publicKey) {
      fetchData()
    }
  }, [publicKey])

  // 3. Cálculo de Conversão
  // USDC é 1:1 com USD. Para BRL usamos taxa real. "XLM" no seletor exibe USDC.
  const getFormattedBalance = () => {
    if (isLoading) return { symbol: "", value: "..." }

    let value = 0
    let symbol = ""

    switch (selectedCurrency) {
      case "USD":
        value = usdcBalance
        symbol = "$"
        break
      case "BRL":
        value = usdcBalance * brlRate
        symbol = "R$"
        break
    }

    const formattedValue = value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return {
      symbol,
      value: formattedValue
    }
  }

  const { symbol, value } = getFormattedBalance()

  // 4. Atualização da UI
  return (
    <div
      className="relative overflow-hidden rounded-[24px] text-white"
      style={{ backgroundColor: "#0F1A2C" }}
    >
      {/* Efeito radial decorativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.15) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 px-5 pt-5 pb-4">
        {/* Cabeçalho do Card: Label e Toggle de Moedas */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-white/50">Total Balance</p>
          
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
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
              <span className="text-white/50 text-sm font-medium">Sincronizando...</span>
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
          className="flex items-center gap-6 border-t pb-4 pt-4 mb-4"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-0.5">
              INVESTED
            </p>
            <p className="text-[15px] font-bold text-white/80">
              {/* O valor investido aqui continua mockado mas reativo simbolicamente */}
              {isLoading ? "..." : selectedCurrency === "USD" ? "$0.00" : "R$0.00"}
            </p>
          </div>
          <div
            className="w-px h-8 self-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-0.5">
              ACCOUNT
            </p>
            <p className="text-[15px] font-bold text-white">
              {isLoading ? "..." : `${symbol}${value}`}
            </p>
          </div>
        </div>

        {/* Badge de ganho mensal — verde semântico */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "#10B981" }}
          >
            ▲ +$0.00 (+0.00%)
          </span>
          <span className="text-[13px] text-white/40">this month</span>
        </div>

        {/* Mini chart */}
        <BalanceChart />
      </div>
    </div>
  )
}
