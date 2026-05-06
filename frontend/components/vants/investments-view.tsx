"use client"

import { useLanguage } from "../providers/LanguageProvider"

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
        stroke="#C7D2FE"
        strokeWidth="4"
        strokeDasharray={`${circumference * 0.11} ${circumference * 0.89}`}
        strokeDashoffset={-cashOffset}
        strokeLinecap="round"
      />
      <circle
        cx="21" cy="21" r="15.9" fill="none"
        stroke="#10B981"
        strokeWidth="4"
        strokeDasharray={`${circumference * 0.20} ${circumference * 0.80}`}
        strokeDashoffset={-balancedOffset}
        strokeLinecap="round"
      />
      <circle
        cx="21" cy="21" r="15.9" fill="none"
        stroke="#6366F1"
        strokeWidth="4"
        strokeDasharray={`${circumference * 0.69} ${circumference * 0.31}`}
        strokeDashoffset={coreOffset}
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
          style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
        >
          {pos.returnPct}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
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
          <p className="text-[15px] font-bold" style={{ color: "#10B981" }}>
            {pos.returns}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <MiniLineChart />
      </div>

      <button
        className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-colors"
        style={{ backgroundColor: "#EEF2FF", color: "#6366F1" }}
      >
        + {t("depositMore")}
      </button>
    </div>
  )
}

// ─── Cards "Earn more" ────────────────────────────────────────────────────────
interface EarnCard {
  id: string
  name: string
  risk: string
  riskColor: string
  riskBg: string
  apy: string
  invested: string
  description: string
}

function EarnCardItem({ card, t }: { card: EarnCard; t: any }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[14px] font-bold text-slate-900">{card.name}</p>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: card.riskBg, color: card.riskColor }}
        >
          {card.risk}
        </span>
      </div>

      <p className="text-[28px] font-bold mb-0.5" style={{ color: "#10B981" }}>
        {card.apy}
        <span className="text-[14px] font-medium text-slate-500"> / {t("yearAbbr")}</span>
      </p>
      <p className="text-[12px] text-slate-500 mb-3">{card.invested}</p>
      <p className="text-[12px] text-slate-600 flex-1 mb-4">{card.description}</p>

      <button
        className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: "#0F1A2C" }}
      >
        {t("invest")}
      </button>
    </div>
  )
}

// ─── View principal ───────────────────────────────────────────────────────────
export function InvestmentsView() {
  const { t } = useLanguage()

  const positions: Position[] = [
    {
      id: "core",
      iconLetter: "C",
      iconBg: "#1A56DB",
      name: "Core Yield",
      risk: `${t("lowRisk")} · ${t("stable")}`,
      returnPct: `8.2% ${t("returns").toLowerCase()}`,
      current: "$1,200.23",
      deposited: "$1,000.00",
      returns: "+200.23",
    },
    {
      id: "balanced",
      iconLetter: "B",
      iconBg: "#0F1A2C",
      name: "Balanced",
      risk: `${t("mediumRisk")} · ${t("growth")}`,
      returnPct: `12.1% ${t("returns").toLowerCase()}`,
      current: "$340.00",
      deposited: "$300.00",
      returns: "+40.00",
    },
  ]

  const earnCards: EarnCard[] = [
    {
      id: "reserve",
      name: "Reserve+",
      risk: t("lowRisk"),
      riskColor: "#10B981",
      riskBg: "#ECFDF5",
      apy: "5.1%",
      invested: `$112M ${t("investedAmount")}`,
      description: "Liquid savings with a daily return. Always available, zero lock-up.",
    },
    {
      id: "core",
      name: "Core Yield",
      risk: t("lowRisk"),
      riskColor: "#10B981",
      riskBg: "#ECFDF5",
      apy: "8.2%",
      invested: `$78M ${t("investedAmount")}`,
      description: "Consistent returns from diversified fixed income. The reliable choice.",
    },
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
              <p className="text-[28px] font-bold" style={{ color: "#10B981" }}>
                8.9%
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#6366F1" }} />
                  <span className="text-[11px] text-slate-600">Core 69%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#10B981" }} />
                  <span className="text-[11px] text-slate-600">Balanced 20%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#C7D2FE" }} />
                  <span className="text-[11px] text-slate-600">Cash 11%</span>
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

        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-slate-900 mb-3">{t("earnMore")}</h2>
          <div className="flex gap-3">
            {earnCards.map((card) => (
              <EarnCardItem key={card.id} card={card} t={t} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
