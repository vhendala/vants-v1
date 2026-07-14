"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "../providers/LanguageProvider"
import { API_URL } from "../../lib/config"

// Mini line chart
function MiniChart() {
  return (
    <svg viewBox="0 0 80 24" className="w-full h-6 mt-2" preserveAspectRatio="none">
      <polyline
        points="0,22 10,20 20,18 30,17 40,15 50,12 60,9 70,7 80,3"
        fill="none"
        stroke="var(--vants-green)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="3" r="2.5" fill="var(--vants-green)" />
    </svg>
  )
}

export function InvestmentPools({ investedBalance = null }: { investedBalance?: number | null }) {
  const { t } = useLanguage()
  const [blendApy, setBlendApy] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/blend/pool-info`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        const xlmReserve = (data.reserves || []).find((r: any) => r.symbol === "XLM");
        if (xlmReserve) setBlendApy(xlmReserve.supplyApy);
      })
      .catch(err => console.error("Falha ao buscar APY Blend:", err));
  }, []);

  const displayApy = blendApy !== null ? `${blendApy.toFixed(2)}%` : "...";

  const pools = [
    {
      id: "blend-xlm",
      name: "Blend · XLM",
      iconSrc: "/blend-logo.svg",
      apy: `${displayApy} APY`,
      subtitle: "Soroban Lending",
    },
  ]

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-bold text-slate-900">{t("myInvestments")}</h2>
        <button className="text-[13px] font-medium" style={{ color: "var(--vants-blue)" }}>
          {t("seeAll")}
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-200 p-4"
          >
            {/* Header: ícone + nome */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 overflow-hidden border border-slate-200 bg-white">
                <img src={pool.iconSrc} alt={pool.name} className="h-6 w-6" />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">{pool.name}</p>
            </div>

            {/* Subtitle */}
            <p className="text-[11px] text-slate-500 mb-2">{pool.subtitle}</p>

            {/* APY badge */}
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "oklch(74% 0.13 155 / 0.06)", color: "var(--vants-green)" }}
              >
                {pool.apy}
              </span>
            </div>

            <MiniChart />
          </div>
        ))}
      </div>
    </section>
  )
}
