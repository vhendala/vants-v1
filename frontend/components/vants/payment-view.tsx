"use client"

import { useState } from "react"
import { ArrowLeft, Zap, Wallet, ArrowLeftRight, CreditCard, Check, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PaymentViewProps {
  onBack: () => void
}

type PaymentSource = "vault" | "swap" | "direct"

const paymentSources = [
  {
    id: "vault" as const,
    name: "Unwind Vault",
    description: "Resgatar do USDC Blend Pool",
    fee: "$0.70",
    icon: Wallet,
    recommended: true,
  },
  {
    id: "swap" as const,
    name: "Trocar Ativo",
    description: "Swap 680 XLM → USDC",
    fee: "$1.25",
    icon: ArrowLeftRight,
    recommended: false,
  },
  {
    id: "direct" as const,
    name: "Pagamento Direto",
    description: "Saldo USDC",
    fee: "$2.00",
    icon: CreditCard,
    recommended: false,
  },
]

export function PaymentView({ onBack }: PaymentViewProps) {
  const [selectedSource, setSelectedSource] = useState<PaymentSource>("vault")
  const [isPaid, setIsPaid] = useState(false)

  const selectedPayment = paymentSources.find(s => s.id === selectedSource)
  const networkFee = selectedPayment?.fee || "$0.70"
  const total = selectedSource === "vault" ? "$100.70" : selectedSource === "swap" ? "$101.25" : "$102.00"

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <div className="mx-auto max-w-md w-full flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground hover:bg-card rounded-xl h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="gradient-text text-sm font-bold uppercase tracking-widest">VANTS</span>
            <div className="w-10" />
          </header>

          {/* Conteúdo de Sucesso */}
          <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
            {/* Ícone de sucesso com glow — eco do CheckCircle2 da landing page Hero */}
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4CAF50] mb-6"
              style={{ boxShadow: "0 0 40px rgba(76, 175, 80, 0.4)" }}
            >
              <Check className="h-12 w-12 text-white" strokeWidth={3} />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento Efetuado!</h1>
            <p className="text-[#4CAF50] flex items-center gap-2 mb-8 font-semibold">
              <Zap className="h-4 w-4" />
              Confirmado em 4.2 segundos
            </p>

            {/* Monospace para valores financeiros */}
            <p className="text-5xl font-bold text-foreground font-mono mb-1">$100.00</p>
            <p className="text-xl text-muted-foreground font-mono">1.850,00 BRL</p>

            {/* Badge de rendimento continuado */}
            <div
              className="mt-8 rounded-xl bg-card border border-[#4CAF50]/20 px-5 py-3"
              style={{ boxShadow: "0 0 20px rgba(76, 175, 80, 0.1)" }}
            >
              <p className="text-sm text-[#4CAF50] flex items-center gap-2 font-semibold">
                <span>↗</span>
                Saldo restante rendendo{" "}
                <span className="font-mono text-[#00D2FF]">8.2% APY</span>
              </p>
            </div>

            {/* Card de detalhes do pagamento */}
            <div className="mt-6 w-full rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6851FF]/15">
                  <CreditCard className="h-5 w-5 text-[#6851FF]" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">PAGO DE</p>
                  <p className="font-bold text-foreground">Conta Vants Yield</p>
                  <p className="text-sm text-muted-foreground font-mono">••84</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">STATUS</p>
                  <p className="text-sm font-bold text-[#4CAF50] uppercase tracking-wider">Confirmado</p>
                </div>
              </div>
            </div>
          </main>

          {/* Botões de Ação */}
          <div className="px-4 pb-8 flex flex-col gap-3">
            <Button
              onClick={onBack}
              className="w-full h-14 bg-[#6851FF] hover:bg-[#5842e6] text-white font-bold text-base rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ boxShadow: "0 8px 24px rgba(104, 81, 255, 0.4)" }}
            >
              Concluído
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 bg-transparent border-border text-foreground hover:bg-card font-bold text-base rounded-2xl transition-all"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Compartilhar Recibo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground hover:bg-card rounded-xl h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-bold text-foreground uppercase tracking-widest">Revisar Pagamento</span>
          <div className="w-10" />
        </header>

        {/* Valor do Pagamento */}
        <div className="text-center px-4 py-6">
          {/* Monospace para valor do pagamento */}
          <h1 className="text-3xl font-bold text-foreground font-mono">Pagar $100.00</h1>
          <p className="mt-1.5 text-[#00D2FF] font-mono text-sm">≈ R$ 1.850,00 via PIX</p>
        </div>

        {/* Conteúdo Principal */}
        <main className="px-4 flex flex-col gap-5">
          {/* Destinatário */}
          <section>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              DESTINATÁRIO
            </p>
            <div className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECC94B]/15">
                <Zap className="h-5 w-5 text-[#ECC94B]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">CFE Energia</p>
                <p className="text-sm text-muted-foreground">Concessionária de Energia</p>
              </div>
              {/* Monospace para dados de conta */}
              <p className="text-sm text-muted-foreground font-mono">CLABE ...5678</p>
            </div>
          </section>

          {/* Fonte do Pagamento */}
          <section>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              PAGAR DE
            </p>
            <div className="flex flex-col gap-3">
              {paymentSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                    selectedSource === source.id
                      ? "border-[#6851FF] bg-[#6851FF]/08 ring-1 ring-[#6851FF]"
                      : "border-border bg-card hover:border-[#6851FF]/30"
                  }`}
                >
                  {source.recommended && (
                    <Badge
                      className="absolute -top-2 right-3 bg-[#6851FF] text-white border-0 text-[9px] font-bold uppercase tracking-wider"
                      style={{ boxShadow: "0 4px 12px rgba(104, 81, 255, 0.4)" }}
                    >
                      Recomendado
                    </Badge>
                  )}

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                      selectedSource === source.id ? "bg-[#6851FF]/20" : "bg-card border border-border"
                    }`}
                  >
                    <source.icon
                      className={`h-5 w-5 ${
                        selectedSource === source.id ? "text-[#6851FF]" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-foreground">{source.name}</p>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                    {/* Monospace para taxas */}
                    <p className="text-sm text-[#00D2FF] font-mono font-semibold mt-0.5">
                      Taxa: {source.fee}
                    </p>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedSource === source.id
                        ? "border-[#6851FF] bg-[#6851FF]"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedSource === source.id && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Resumo */}
          <section className="rounded-2xl bg-card border border-border p-4">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Valor do Pagamento</span>
              {/* Monospace para todos os valores */}
              <span className="font-bold text-foreground font-mono">$100.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground text-sm">Taxa de Rede</span>
              <span className="font-bold text-foreground font-mono">{networkFee}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-border mt-2 pt-3">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-[#00D2FF] text-lg font-mono">{total}</span>
            </div>
          </section>

          {/* Botão principal com glow indigo */}
          <Button
            onClick={() => setIsPaid(true)}
            className="w-full h-14 bg-[#6851FF] hover:bg-[#5842e6] text-white font-bold text-base rounded-2xl mb-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ boxShadow: "0 8px 24px rgba(104, 81, 255, 0.4)" }}
          >
            Confirmar Pagamento
          </Button>

          <p className="text-center text-xs text-muted-foreground pb-8">
            Ao confirmar, você autoriza a Vants a executar a transação a partir da fonte selecionada.
          </p>
        </main>
      </div>
    </div>
  )
}
