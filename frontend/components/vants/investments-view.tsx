"use client"

import { Filter, Landmark, Rocket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const positions = [
  {
    id: "usdc",
    name: "USDC Blend Pool",
    apy: "8.2%",
    icon: Landmark,
    iconBg: "bg-[#00D2FF]/15",
    iconColor: "text-[#00D2FF]",
  },
  {
    id: "xlm",
    name: "XLM Blend Pool",
    apy: "12.1%",
    icon: Rocket,
    iconBg: "bg-[#6851FF]/15",
    iconColor: "text-[#6851FF]",
  },
]

const strategies = [
  {
    id: "btc",
    name: "BTC Alpha Yield",
    risk: "BAIXO RISCO",
    riskClass: "bg-[#4CAF50]/15 text-[#4CAF50] border-[#4CAF50]/20",
    tvl: "$42.5M",
    apy: "14.2%",
    icon: "BTC",
    iconBg: "bg-[#ECC94B]/15",
    iconColor: "text-[#ECC94B]",
    glowColor: "rgba(236, 201, 75, 0.2)",
  },
  {
    id: "eth",
    name: "ETH Liquid Staking",
    risk: "MÉDIO RISCO",
    riskClass: "bg-[#ECC94B]/15 text-[#ECC94B] border-[#ECC94B]/20",
    tvl: "$128.1M",
    apy: "18.5%",
    icon: "ETH",
    iconBg: "bg-[#00D2FF]/15",
    iconColor: "text-[#00D2FF]",
    glowColor: "rgba(0, 210, 255, 0.2)",
  },
  {
    id: "sol",
    name: "SOL High Frequency",
    risk: "ALTO RISCO",
    riskClass: "bg-red-500/15 text-red-400 border-red-500/20",
    tvl: "$8.2M",
    apy: "34.9%",
    icon: "SOL",
    iconBg: "bg-[#6851FF]/15",
    iconColor: "text-[#6851FF]",
    glowColor: "rgba(104, 81, 255, 0.2)",
  },
]

export function InvestmentsView() {
  return (
    <main className="px-4 py-4 flex flex-col gap-6">
      {/* Posições Ativas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Suas Posições</h2>
          <button className="text-xs font-bold text-[#6851FF] hover:text-[#5842e6] transition-colors uppercase tracking-widest">
            Ver Tudo
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {positions.map((position) => (
            <div
              key={position.id}
              className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4 hover:border-[#6851FF]/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${position.iconBg} shrink-0`}
              >
                <position.icon className={`h-6 w-6 ${position.iconColor}`} />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  POSIÇÃO ATIVA
                </p>
                <p className="font-bold text-foreground">{position.name}</p>
                {/* Monospace para APY */}
                <p className="text-sm text-[#4CAF50] font-bold font-mono mt-0.5">
                  {position.apy} APY
                </p>
              </div>

              <Button
                size="sm"
                className="bg-[#6851FF] hover:bg-[#5842e6] text-white font-bold rounded-xl text-xs shrink-0 transition-all hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 4px 12px rgba(104, 81, 255, 0.3)" }}
              >
                Gerenciar
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Estratégias Disponíveis */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Estratégias</h2>
          <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="rounded-2xl bg-card border border-border p-4 hover:border-[#6851FF]/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Ícone cripto com glow colorido */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${strategy.iconBg} text-sm font-bold font-mono ${strategy.iconColor}`}
                    style={{ boxShadow: `0 0 16px ${strategy.glowColor}` }}
                  >
                    {strategy.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{strategy.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Badge de risco com bordas sutis — eco dos badges da landing */}
                      <Badge
                        className={`${strategy.riskClass} border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5`}
                      >
                        {strategy.risk}
                      </Badge>
                      {/* Monospace obrigatório para TVL */}
                      <span className="text-xs text-muted-foreground font-mono">
                        TVL: {strategy.tvl}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {/* Monospace para APY — cyan (destaque informativo) */}
                  <p className="text-2xl font-bold text-[#00D2FF] font-mono">{strategy.apy}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                    APY Est.
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-[#6851FF] hover:bg-[#5842e6] text-white font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ boxShadow: "0 4px 16px rgba(104, 81, 255, 0.3)" }}
              >
                Depositar Agora
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
