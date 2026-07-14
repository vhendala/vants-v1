"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "../providers/LanguageProvider"
import { API_URL } from "../../lib/config"

// ─── View principal ───────────────────────────────────────────────────────────
export function InvestmentsView({
  publicKey,
  onOpenBlend,
}: {
  investedBalance?: number | null;
  usdcBalance?: number | null;
  tesouroBalance?: number | null;
  publicKey?: string;
  onSweepComplete?: () => void;
  onOpenBlend?: () => void;
}) {
  const { t } = useLanguage()

  // Blend (Soroban Lending) — colateral suprido, dívida e APY de supply.
  const [blendSupplied, setBlendSupplied] = useState(0);
  const [blendBorrowed, setBlendBorrowed] = useState(0);
  const [blendSupplyApy, setBlendSupplyApy] = useState<number | null>(null);

  useEffect(() => {
    const url = publicKey
      ? `${API_URL}/api/blend/pool-info?publicKey=${publicKey}`
      : `${API_URL}/api/blend/pool-info`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        const xlm = data.positions?.XLM;
        setBlendSupplied((xlm?.collateral || 0) + (xlm?.supply || 0));
        setBlendBorrowed(data.positions?.USDC?.liabilities || 0);
        const xlmReserve = (data.reserves || []).find((r: any) => r.symbol === "XLM");
        if (xlmReserve) setBlendSupplyApy(xlmReserve.supplyApy);
      })
      .catch(err => console.error("Falha ao buscar Blend pool-info:", err));
  }, [publicKey]);

  return (
    <main className="bg-slate-50 min-h-screen pb-28">
      <div className="bg-white px-5 pt-6 pb-5 border-b border-slate-100">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          {t("portfolio")}
        </p>
        <h1 className="text-[26px] font-bold text-slate-900">{t("yourInvestments")}</h1>
      </div>

      <div className="px-5 pt-5">

        {/* ─── Blend · Empréstimos (Soroban Lending) ─────────────────────────── */}
        <section className="mb-6">
          <h2 className="text-[17px] font-bold text-slate-900 mb-3">Blend · Lending</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 overflow-hidden border border-slate-200 bg-white"
                >
                  {/* Logo oficial do Blend (media-kit), usado sem alterações */}
                  <img src="/blend-logo.svg" alt="Blend" className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-slate-900">Blend · XLM</p>
                  <p className="text-[12px] text-slate-500">Colateral on-chain · Soroban</p>
                </div>
              </div>
              {blendSupplyApy !== null && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "oklch(74% 0.13 155 / 0.06)", color: "var(--vants-green)" }}
                >
                  {blendSupplyApy.toFixed(2)}% APY
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5">Depositado (XLM)</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {blendSupplied.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5">Emprestado (USDC)</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {blendBorrowed.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBlend}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--vants-blue-deep)" }}
            >
              Depositar, sacar ou emprestar
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
