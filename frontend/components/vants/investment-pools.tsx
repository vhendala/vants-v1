"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "../providers/LanguageProvider"
import { API_URL } from "../../lib/config"

// Mini line chart idêntico ao das imagens
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

export function InvestmentPools() {
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

  const pools = [
    {
      id: "blendusdc",
      name: "Cofre de Dólar",
      iconLetter: "B",
      iconBg: "#1A56DB",
      apy: `${displayApy}% ${t("returns").toLowerCase()}`,
      value: "$0.00",
      returns: "+$0.00",
    }
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
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-white text-[11px] font-bold shrink-0"
                style={{ backgroundColor: pool.iconBg }}
              >
                {pool.iconLetter}
              </div>
              <p className="text-[13px] font-semibold text-slate-700">{pool.name}</p>
            </div>

            {/* Valor */}
            <p className="text-[20px] font-bold text-slate-900 mb-2">{pool.value}</p>

            {/* APY badge + returns */}
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "oklch(74% 0.13 155 / 0.06)", color: "var(--vants-green)" }}
              >
                {pool.apy}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: "var(--vants-green)" }}>
                {pool.returns}
              </span>
            </div>

            <MiniChart />
          </div>
        ))}
      </div>
    </section>
  )
}
