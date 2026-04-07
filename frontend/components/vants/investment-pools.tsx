"use client"

import { Landmark, Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const pools = [
  {
    id: "usdc",
    name: "USDC POOL",
    icon: Landmark,
    apy: "8.2%",
    value: "$1,200.23",
    iconBg: "bg-[#00D2FF]/15",
    iconColor: "text-[#00D2FF]",
    glowColor: "rgba(0, 210, 255, 0.15)",
    borderHover: "hover:border-[#00D2FF]/30",
  },
  {
    id: "xlm",
    name: "XLM POOL",
    icon: Coins,
    apy: "12.1%",
    value: "$340.00",
    iconBg: "bg-[#ECC94B]/15",
    iconColor: "text-[#ECC94B]",
    glowColor: "rgba(236, 201, 75, 0.15)",
    borderHover: "hover:border-[#ECC94B]/30",
  },
]

export function InvestmentPools() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground capitalize">Pools Ativos</h2>
        <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest active:scale-95">
          Gerenciar
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className={`group flex-shrink-0 w-48 md:w-56 rounded-2xl bg-card border border-border p-4 md:p-5 cursor-pointer backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-lg ${pool.borderHover}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${pool.iconBg}`}
                style={{ boxShadow: `0 0 12px ${pool.glowColor}` }}
              >
                <pool.icon className={`h-5 w-5 ${pool.iconColor}`} />
              </div>
              {/* Badge APY com cor de sucesso aprimorado */}
              <Badge className="bg-[#4CAF50]/20 md:bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/30 text-[11px] md:text-xs font-bold font-sans px-2 py-0.5 transition-colors group-hover:bg-[#4CAF50]/25">
                {pool.apy} APY
              </Badge>
            </div>

            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 mt-1 transition-colors group-hover:text-foreground/70">
              {pool.name}
            </p>
            {/* Sans obrigatório para dados financeiros para match da landing page */}
            <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans truncate">
              {pool.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
