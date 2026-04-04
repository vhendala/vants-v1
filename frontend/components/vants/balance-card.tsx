"use client"

import { TrendingUp, BarChart3, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ boxShadow: "0 8px 40px rgba(104, 81, 255, 0.25)" }}>
      {/* Background gradiente indigo — assinatura visual da landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6851FF] via-[#5842e6] to-[#4030c8]" />

      {/* Dots decorativos (eco dos elementos decorativos da hero da landing) */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#00D2FF]/15 blur-2xl" />
      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-white/40 animate-float" />
      <div className="absolute top-12 right-12 w-1 h-1 rounded-full bg-white/30 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-8 right-8 w-1 h-1 rounded-full bg-[#00D2FF]/60 animate-float" style={{ animationDelay: "2s" }} />

      {/* Radial dot grid (sutil como na hero da landing) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 px-5 pt-6 pb-5">
        {/* Badge "live" — eco do badge pulsante da navbar da landing */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            Portfólio Total
          </p>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/80 font-semibold tracking-wider uppercase">Ao vivo</span>
          </div>
        </div>

        {/* Valor principal — JetBrains Mono obrigatório */}
        <p className="text-5xl font-bold tracking-tight font-mono text-white mb-2">
          $1,740.23
        </p>

        {/* Variação 30d */}
        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl mb-6">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-sm font-semibold font-mono">
            <span className="text-emerald-400">+$12.47</span>
            <span className="text-white/60 ml-1">(0.72%)</span>
            <span className="text-white/40 ml-1">/ 30d</span>
          </span>
        </div>

        {/* Footer do card */}
        <div className="flex items-end justify-between border-t border-white/15 pt-4">
          <div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
              Rendimento Total
            </p>
            <p className="text-2xl font-bold font-mono text-white">$47.82</p>
            <div className="mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold font-mono">8.2% APY</span>
            </div>
          </div>

          <Button
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Relatórios
          </Button>
        </div>
      </div>
    </div>
  )
}
