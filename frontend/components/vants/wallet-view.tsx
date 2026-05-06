"use client"

import { useState } from "react"
import { X, Zap, ChevronRight } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

interface RecentPayee {
  id: string
  name: string
  clabe: string
  initial: string
  color: string
}

const recentPayees: RecentPayee[] = [
  {
    id: "cfe",
    name: "CFE Electric",
    clabe: "CLABE ****4521",
    initial: "C",
    color: "#10B981", // green
  },
  {
    id: "telmex",
    name: "Telmex Internet",
    clabe: "CLABE ****7833",
    initial: "T",
    color: "#6366F1", // purple
  },
  {
    id: "uber",
    name: "Uber Eats · MX",
    clabe: "CLABE ****2198",
    initial: "U",
    color: "#D97706", // orange
  },
]

interface WalletViewProps {
  onPayBill?: () => void
}

export function WalletView({ onPayBill }: WalletViewProps) {
  const { t } = useLanguage()
  // Tela estática mockando o scanner conforme a imagem 3.
  return (
    <div className="flex flex-col min-h-screen bg-[#1c1c1e]">
      {/* Área superior escura da câmera */}
      <div className="relative flex-1 flex flex-col pt-12 pb-8">
        
        {/* Controles do Topo */}
        <div className="flex items-center justify-between px-4 z-20">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/90">
            <X className="h-5 w-5" />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
            <span className="text-white font-bold text-[14px]">{t("scanToPay")}</span>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/90">
            <Zap className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder e Grid simulado */}
        <div className="flex-1 relative flex items-center justify-center mt-4">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Grid Pattern (apenas ilustrativo como na imagem) */}
            <div className="absolute inset-4 grid grid-cols-10 grid-rows-10 gap-1 opacity-20">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="bg-white rounded-sm" />
              ))}
            </div>

            {/* Cantos roxos */}
            <span className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#6366F1] rounded-tl-xl" />
            <span className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#6366F1] rounded-tr-xl" />
            <span className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#6366F1] rounded-bl-xl" />
            <span className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#6366F1] rounded-br-xl" />
          </div>
        </div>

        {/* Instrução inferior */}
        <div className="flex justify-center mb-6">
          <p className="text-white font-bold text-[14px] text-center px-6">
            {t("alignQr")}
          </p>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-[#F8FAFC] rounded-t-3xl pt-5 px-5 pb-12 z-20">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[15px] font-bold text-[#0F1A2C]">{t("recentPayees")}</h2>
          <button
            onClick={onPayBill}
            className="text-[14px] font-medium"
            style={{ color: "#6366F1" }}
          >
            {t("enterManually")}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {recentPayees.map((payee) => (
            <button
              key={payee.id}
              onClick={onPayBill}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors w-full text-left"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: payee.color }}
              >
                <span className="text-white font-bold text-[18px] leading-none">
                  {payee.initial}
                </span>
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-[15px] text-[#0F1A2C] mb-0.5">{payee.name}</p>
                <p className="text-[13px] font-mono text-slate-500">{payee.clabe}</p>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
