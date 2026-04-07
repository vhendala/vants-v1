"use client"

import { TrendingUp, BarChart3, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border dark:border-white/5 transition-all duration-500 hover:shadow-lg dark:hover:shadow-2xl hover:-translate-y-1 group dark:shadow-[var(--glow-indigo)]">
      {/* Background gradiente indigo APENAS no dark mode */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-primary dark:via-primary/80 dark:to-primary/60 dark:opacity-90 transition-opacity duration-500 group-hover:dark:opacity-100" />

      {/* Dots decorativos (somente perceptíveis quando há gradiente/dark) */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full dark:bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-125 group-hover:translate-x-4 opacity-0 dark:opacity-100" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full dark:bg-accent/20 blur-2xl transition-transform duration-700 group-hover:scale-125 group-hover:-translate-x-4 opacity-0 dark:opacity-100" />
      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full dark:bg-white/40 animate-float opacity-0 dark:opacity-100" />
      <div className="absolute top-12 right-12 w-1 h-1 rounded-full dark:bg-white/30 animate-float opacity-0 dark:opacity-100" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-8 right-8 w-1 h-1 rounded-full dark:bg-accent/60 animate-float opacity-0 dark:opacity-100" style={{ animationDelay: "2s" }} />

      {/* Radial dot grid - desativado ou sutil no light mode */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 px-5 pt-6 pb-5">
        {/* Badge "live" */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-muted-foreground dark:text-white/70 uppercase tracking-widest">
            Portfólio Total
          </p>
          <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-white/10 px-2.5 py-1 rounded-full border border-primary/10 dark:border-transparent">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
            <span className="text-[10px] text-foreground dark:text-white/80 font-semibold tracking-wider uppercase">Ao vivo</span>
          </div>
        </div>

        {/* Valor principal — JetBrains Mono */}
        <p className="text-5xl font-bold tracking-tight font-mono text-primary dark:text-white mb-2">
          $1,740.23
        </p>

        {/* Variação 30d */}
        <div className="inline-flex items-center gap-2 bg-[#4CAF50]/10 dark:bg-white/10 px-3 py-1.5 rounded-xl mb-6">
          <TrendingUp className="h-3.5 w-3.5 text-[#4CAF50]" />
          <span className="text-sm font-semibold font-mono">
            <span className="text-[#4CAF50]">+$12.47</span>
            <span className="text-muted-foreground dark:text-white/60 ml-1">(0.72%)</span>
            <span className="text-muted-foreground/60 dark:text-white/40 ml-1">/ 30d</span>
          </span>
        </div>

        {/* Footer do card */}
        <div className="flex items-end justify-between border-t border-border dark:border-white/15 pt-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-white/60 uppercase tracking-widest mb-1">
              Rendimento Total
            </p>
            <p className="text-2xl font-bold font-mono text-foreground dark:text-white">$47.82</p>
            <div className="mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-[#4CAF50]" />
              <span className="text-xs text-[#4CAF50] font-semibold font-mono">8.2% APY</span>
            </div>
          </div>

          <Button
            size="sm"
            className="bg-transparent dark:bg-white/15 hover:bg-primary/5 dark:hover:bg-white/25 text-primary dark:text-white border border-primary/20 dark:border-white/20 backdrop-blur-sm rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Relatórios
          </Button>
        </div>
      </div>
    </div>
  )
}
