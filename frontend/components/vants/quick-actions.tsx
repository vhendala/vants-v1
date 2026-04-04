"use client"

import { Receipt, Plus, ArrowLeftRight } from "lucide-react"

interface QuickActionsProps {
  onPayBill?: () => void
}

export function QuickActions({ onPayBill }: QuickActionsProps) {
  const actions = [
    {
      icon: Receipt,
      label: "PAGAR",
      onClick: onPayBill,
      // Ação primária: indigo (alinhado com a landing page — hover dos botões CTA)
      active: true,
      activeClass: "bg-[#6851FF] text-white shadow-lg",
      activeStyle: { boxShadow: "0 4px 20px rgba(104, 81, 255, 0.4)" },
    },
    {
      icon: Plus,
      label: "DEPOSITAR",
      onClick: () => {},
      active: false,
      activeClass: "",
      activeStyle: {},
    },
    {
      icon: ArrowLeftRight,
      label: "CONVERTER",
      onClick: () => {},
      active: false,
      activeClass: "",
      activeStyle: {},
    },
  ]

  return (
    <div className="flex justify-center gap-8">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="group flex flex-col items-center gap-2.5"
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 hover:scale-105 ${
              action.active
                ? action.activeClass
                // Usa variáveis do tema — sem hardcode incompatível
                : "bg-card text-muted-foreground hover:bg-card/80 border border-border hover:border-[#6851FF]/20"
            }`}
            style={action.active ? action.activeStyle : {}}
          >
            <action.icon className="h-6 w-6" />
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
              action.active
                ? "text-[#6851FF]"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
