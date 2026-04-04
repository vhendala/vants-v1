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
        <h2 className="text-lg font-bold text-foreground">Pools Ativos</h2>
        <button className="text-xs font-bold text-[#6851FF] hover:text-[#5842e6] transition-colors uppercase tracking-widest">
          Gerenciar
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className={`flex-shrink-0 w-48 rounded-2xl bg-card border border-border p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 ${pool.borderHover}`}
            style={{ transition: "all 0.2s ease" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${pool.iconBg}`}
                style={{ boxShadow: `0 0 12px ${pool.glowColor}` }}
              >
                <pool.icon className={`h-5 w-5 ${pool.iconColor}`} />
              </div>
              {/* Badge APY com cor de sucesso — eco da landing page */}
              <Badge className="bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/20 text-[10px] font-bold font-mono px-2 py-0.5">
                {pool.apy} APY
              </Badge>
            </div>

            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {pool.name}
            </p>
            {/* Monospace obrigatório para dados financeiros */}
            <p className="text-xl font-bold text-foreground font-mono">
              {pool.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
