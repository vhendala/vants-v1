"use client"

// Mini line chart idêntico ao das imagens
function MiniChart() {
  return (
    <svg viewBox="0 0 80 24" className="w-full h-6 mt-2" preserveAspectRatio="none">
      <polyline
        points="0,22 10,20 20,18 30,17 40,15 50,12 60,9 70,7 80,3"
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="3" r="2.5" fill="#10B981" />
    </svg>
  )
}

const pools = [
  {
    id: "core-yield",
    name: "Core Yield",
    iconLetter: "C",
    iconBg: "#1A56DB",
    apy: "8.2% return",
    value: "$1,200.23",
    returns: "+$8.20",
  },
  {
    id: "balanced",
    name: "Balanced",
    iconLetter: "B",
    iconBg: "#081329",
    apy: "12.1% return",
    value: "$340.00",
    returns: "+$4.27",
  },
]

export function InvestmentPools() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-bold text-slate-900">My investments</h2>
        <button className="text-[13px] font-medium" style={{ color: "#6366F1" }}>
          See all
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
                style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}
              >
                {pool.apy}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: "#10B981" }}>
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
