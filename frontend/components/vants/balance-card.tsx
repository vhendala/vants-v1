"use client"

import { Eye } from "lucide-react"

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

export function BalanceCard() {
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
        {/* Total Balance + eye */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-medium text-white/50">Total Balance</p>
          <button className="text-white/40 hover:text-white/70 transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </div>

        {/* Valor principal */}
        <p className="text-[42px] font-bold tracking-tight leading-none mb-4">
          <span className="text-[22px] align-top mt-2 inline-block font-medium opacity-70">$</span>
          1,740.23
        </p>

        {/* INVESTED / ACCOUNT */}
        <div
          className="flex items-center gap-6 border-t pb-4 pt-4 mb-4"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-0.5">
              INVESTED
            </p>
            <p className="text-[15px] font-bold">$1,540.23</p>
          </div>
          <div
            className="w-px h-8 self-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-0.5">
              ACCOUNT
            </p>
            <p className="text-[15px] font-bold">$200.00</p>
          </div>
        </div>

        {/* Badge de ganho mensal — verde semântico */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "#10B981" }}
          >
            ▲ +$12.47 (+0.72%)
          </span>
          <span className="text-[13px] text-white/40">this month</span>
        </div>

        {/* Mini chart */}
        <BalanceChart />
      </div>
    </div>
  )
}
