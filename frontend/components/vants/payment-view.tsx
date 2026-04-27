"use client"

import { useState } from "react"
import { ArrowLeft, Check, Share2, ChevronRight, Lock, Clock, Asterisk } from "lucide-react"

interface PaymentViewProps {
  onBack: () => void
}

type PaymentSource = "vault" | "swap" | "direct"

const paymentSources = [
  {
    id: "vault" as const,
    name: "Use investments",
    description: "Sell from Core Yield\nYour return rate stays at 8.2%",
    fee: "$0.70",
    recommended: true,
  },
  {
    id: "swap" as const,
    name: "Convert funds",
    description: "Sell from Balanced\nCurrent value: $340.00",
    fee: "$0.80",
    recommended: false,
  },
  {
    id: "direct" as const,
    name: "From cash",
    description: "Use $200.00 cash balance\nNo conversion needed",
    fee: "$0.00",
    recommended: false,
  },
]

export function PaymentView({ onBack }: PaymentViewProps) {
  const [selectedSource, setSelectedSource] = useState<PaymentSource>("vault")
  const [isPaid, setIsPaid] = useState(false)

  if (isPaid) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F1A2C] flex flex-col font-sans">
        <div className="mx-auto max-w-md w-full flex-1 flex flex-col pt-12 pb-8">
          {/* Sucesso centralizado */}
          <main className="flex-1 flex flex-col items-center pt-8 px-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full mb-8" style={{ backgroundColor: "#E6F8ED" }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#10B981" }}>
                <Check className="h-8 w-8 text-white" strokeWidth={4} />
              </div>
            </div>

            <h1 className="text-[28px] font-bold text-[#0F1A2C] mb-4">Payment Complete</h1>
            
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] font-bold text-[#0F1A2C] leading-none">$100.00</span>
              <span className="text-[24px] text-slate-400">→</span>
              <span className="text-[40px] font-bold text-[#0F1A2C] leading-none">1,850.00</span>
            </div>
            <p className="text-[18px] font-bold text-slate-500 mb-8">MXN</p>

            <div className="flex items-center justify-center px-4 py-1.5 rounded-full border border-slate-200 bg-white mb-4">
              <span className="text-[12px] font-mono text-slate-600">SPEI Ref: 2026031612345678</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 mb-10">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[13px]">Settled in 4.2 seconds</span>
            </div>

            {/* Banner Roxo de Rendimento */}
            <div className="w-full rounded-xl border border-indigo-100 p-4 flex gap-3 items-start" style={{ backgroundColor: "#F3F4FE" }}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: "#DDE0FE" }}>
                <Asterisk className="h-4 w-4" style={{ color: "#6366F1" }} />
              </div>
              <p className="text-[13px] text-[#0F1A2C] leading-relaxed">
                Your remaining <span className="font-bold">$1,100</span> keeps growing at <span className="font-bold" style={{ color: "#10B981" }}>8.2% a year</span> — without you lifting a finger.
              </p>
            </div>
          </main>

          {/* Botões Bottom */}
          <div className="px-5 mt-auto pt-8 flex gap-3">
            <button
              className="flex-1 h-14 rounded-full border border-slate-200 bg-white flex items-center justify-center gap-2 text-[15px] font-bold text-[#0F1A2C] hover:bg-slate-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share Receipt
            </button>
            <button
              onClick={onBack}
              className="flex-1 h-14 rounded-full text-white font-bold text-[15px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#0F1A2C" }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F1A2C] flex flex-col font-sans pb-10">
      <div className="mx-auto max-w-md w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 mb-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0F1A2C] hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-[15px] font-bold text-[#0F1A2C]">Review Payment</span>
          <div className="w-10" />
        </header>

        {/* Valor do Pagamento */}
        <div className="text-center px-4 mb-8">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-3">YOU'RE PAYING</p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-[28px] font-bold text-slate-400">$</span>
            <span className="text-[56px] font-extrabold text-[#0F1A2C] leading-none tracking-tight">100.00</span>
            <span className="text-[16px] font-bold text-slate-500 ml-1">USD</span>
          </div>
          <p className="text-[13px] text-slate-500">≈ 1,850.00 MXN · 1 USD = 18.50 MXN</p>
        </div>

        {/* Conteúdo Principal */}
        <main className="px-5 flex flex-col gap-6">
          {/* Destinatário */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "#10B981" }}>
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="font-bold text-[15px] text-[#0F1A2C]">CFE Suministrador</p>
                <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: "#10B981" }}>
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-500">CLABE: 0021 8001 ****4521</p>
            </div>
          </div>

          {/* Fonte do Pagamento */}
          <section>
            <h2 className="text-[17px] font-bold text-[#0F1A2C] mb-4">Pay from</h2>
            <div className="flex flex-col gap-3">
              {paymentSources.map((source) => {
                const isSelected = selectedSource === source.id
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`relative w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected ? "border-[#6366F1] bg-[#F3F4FE]" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {source.recommended && (
                      <div
                        className="absolute -top-2.5 right-4 px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ backgroundColor: "#6366F1" }}
                      >
                        <Asterisk className="h-2.5 w-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">RECOMMENDED</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Custom Radio Button */}
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center shrink-0">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#6366F1]" : "border-slate-300"}`}>
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#6366F1" }} />}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[15px] text-[#0F1A2C]">{source.name}</p>
                          <p className="font-bold text-[13px] text-[#0F1A2C]">{source.fee}</p>
                        </div>
                        <p className="text-[13px] text-slate-500 whitespace-pre-line">{source.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Resumo - Fee Breakdown */}
          <button className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors">
            <span className="text-[14px] text-[#0F1A2C]">Fee breakdown</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-[14px] text-[#0F1A2C]">Total $100.70</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        </main>

        {/* Fixar botão no bottom via wrapper se desejar, mas seguindo o print está no final do scroll */}
        <div className="px-5 mt-8">
          <button
            onClick={() => setIsPaid(true)}
            className="flex w-full h-[60px] items-center justify-center gap-2 rounded-full text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "#0F1A2C" }}
          >
            <Lock className="h-4 w-4" />
            <span className="font-bold text-[16px]">Confirm Payment · $100.70</span>
          </button>
        </div>
      </div>
    </div>
  )
}
