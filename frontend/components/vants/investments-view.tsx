"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "../providers/LanguageProvider"
import { API_URL } from "../../lib/config"

// ─── Mini gráfico de linha decorativo SVG ────────────────────────────────────
function MiniLineChart({ color = "#10B981" }: { color?: string }) {
  return (
    <svg viewBox="0 0 120 36" className="w-full h-9" preserveAspectRatio="none">
      <polyline
        points="0,32 15,30 25,28 35,26 45,24 55,20 65,16 75,14 85,10 95,8 105,6 120,2"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="2" r="3" fill={color} />
    </svg>
  )
}

// ─── Donut Chart SVG ──────────────────────────────────────────────────────────
function DonutChart() {
  const circumference = 99.9
  const coreOffset = 0
  const balancedOffset = circumference * (1 - 0.69)
  const cashOffset = circumference * (1 - 0.69 - 0.20)

  return (
    <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="4" />
      <circle
        cx="21" cy="21" r="15.9" fill="none"
        stroke="var(--vants-blue)"
        strokeWidth="4"
        strokeDasharray={`${circumference} 0`}
        strokeDashoffset={0}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Card de posição ativa ────────────────────────────────────────────────────
interface Position {
  id: string
  iconLetter: string
  iconBg: string
  name: string
  risk: string
  returnPct: string
  current: string
  deposited: string
  returns: string
  projected12m: string
}

function PositionCard({ pos, t }: { pos: Position; t: any }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: pos.iconBg }}
          >
            {pos.iconLetter}
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">{pos.name}</p>
            <p className="text-[12px] text-slate-500">{pos.risk}</p>
          </div>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "oklch(74% 0.13 155 / 0.06)", color: "var(--vants-green)" }}
        >
          {pos.returnPct}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div>
          <p className="text-[11px] text-slate-500 mb-0.5">{t("current")}</p>
          <p className="text-[15px] font-bold text-slate-900">{pos.current}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 mb-0.5">{t("deposited")}</p>
          <p className="text-[15px] font-bold text-slate-900">{pos.deposited}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 mb-0.5">{t("returns")}</p>
          <p className="text-[15px] font-bold" style={{ color: "var(--vants-green)" }}>
            {pos.returns}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 mb-0.5">Previsto 12M</p>
          <p className="text-[15px] font-bold" style={{ color: "var(--vants-green)" }}>
            {pos.projected12m}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <MiniLineChart />
      </div>

    </div>
  )
}

// ─── View principal ───────────────────────────────────────────────────────────
export function InvestmentsView({ investedBalance = null }: { investedBalance?: number | null }) {
  const { t } = useLanguage()
  const [apy, setApy] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/invest/vault-info`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.apy) setApy(data.apy);
      })
      .catch(err => console.error("Falha ao buscar APY:", err));
  }, []);

  const displayApy = apy !== null ? apy.toFixed(1) : "7.5";
  const displayValue = investedBalance !== null ? `$${investedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "...";
  
  const projected12mValue = investedBalance !== null && apy !== null ? 
    `+$${(investedBalance * (apy / 100)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "...";

  const positions: Position[] = [
    {
      id: "blendusdc",
      iconLetter: "B",
      iconBg: "#1A56DB",
      name: "Cofre de Dólar",
      risk: `${t("lowRisk")} · Defindex Vault`,
      returnPct: `${displayApy}% ${t("returns").toLowerCase()}`,
      current: displayValue, 
      deposited: displayValue,
      returns: "+$0.00",
      projected12m: projected12mValue,
    }
  ]

  return (
    <main className="bg-slate-50 min-h-screen pb-28">
      <div className="bg-white px-5 pt-6 pb-5 border-b border-slate-100">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          {t("portfolio")}
        </p>
        <h1 className="text-[26px] font-bold text-slate-900">{t("yourInvestments")}</h1>
      </div>

      <div className="px-5 pt-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <DonutChart />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[12px] text-slate-500">{t("averageAnnualReturn")}</p>
              <p className="text-[28px] font-bold" style={{ color: "var(--vants-green)" }}>
                {displayApy}%
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "var(--vants-blue)" }} />
                  <span className="text-[11px] text-slate-600">Cofre de Dólar 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-slate-900 mb-3">{t("activePositions")}</h2>
          {positions.map((pos) => (
            <PositionCard key={pos.id} pos={pos} t={t} />
          ))}
        </section>
      </div>
    </main>
  )
}
