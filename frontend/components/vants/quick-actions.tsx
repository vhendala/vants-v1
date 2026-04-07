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
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 active:scale-95 group-hover:scale-105 group-hover:shadow-md group-hover:border-primary/30"
          >
            <action.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
          </div>
          <span
            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors"
          >
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
