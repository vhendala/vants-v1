"use client"

import { Zap, ArrowDownLeft, Droplets } from "lucide-react"

const transactions = [
  {
    id: 1,
    title: "CFE Conta de Luz",
    date: "15 Mar",
    type: "Pagamento",
    amount: "-$85.00",
    status: "CONCLUÍDO",
    icon: Zap,
    iconBg: "bg-[#ECC94B]/15",
    iconColor: "text-[#ECC94B]",
    isNegative: true,
  },
  {
    id: 2,
    title: "Depósito ACH",
    date: "12 Mar",
    type: "Entrada",
    amount: "+$250.00",
    status: "CONCLUÍDO",
    icon: ArrowDownLeft,
    iconBg: "bg-[#4CAF50]/15",
    iconColor: "text-[#4CAF50]",
    isNegative: false,
  },
  {
    id: 3,
    title: "Serviço de Água",
    date: "10 Mar",
    type: "Pagamento",
    amount: "-$32.10",
    status: "CONCLUÍDO",
    icon: Droplets,
    iconBg: "bg-[#00D2FF]/15",
    iconColor: "text-[#00D2FF]",
    isNegative: true,
  },
]

export function RecentActivity() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>
        <button className="text-xs font-bold text-[#6851FF] hover:text-[#5842e6] transition-colors uppercase tracking-widest">
          Ver Tudo
        </button>
      </div>

      <div className="flex flex-col rounded-2xl overflow-hidden border border-border">
        {transactions.map((tx, index) => (
          <div
            key={tx.id}
            className={`flex items-center gap-4 p-4 bg-card transition-colors hover:bg-card/80 cursor-pointer ${
              index < transactions.length - 1 ? "border-b border-border" : ""
            }`}
          >
            {/* Ícone com glow sutil */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${tx.iconBg}`}
            >
              <tx.icon className={`h-5 w-5 ${tx.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{tx.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tx.date} · {tx.type}
              </p>
            </div>

            <div className="text-right shrink-0">
              {/* Monospace obrigatório para dados financeiros */}
              <p
                className={`font-bold font-mono text-sm ${
                  tx.isNegative ? "text-foreground" : "text-[#4CAF50]"
                }`}
              >
                {tx.amount}
              </p>
              <p className="text-[9px] font-bold text-[#4CAF50] uppercase tracking-widest mt-0.5">
                {tx.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
