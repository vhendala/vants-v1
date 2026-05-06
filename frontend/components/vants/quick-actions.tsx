"use client"

import { CreditCard, Plus, ArrowLeftRight } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

interface QuickActionsProps {
  onPayBill?: () => void
}

export function QuickActions({ onPayBill }: QuickActionsProps) {
  const { t } = useLanguage()
  const actions = [
    {
      id: "pay",
      icon: CreditCard,
      label: t("pay"),
      // Botão navy com ícone e label brancos — exatamente como na imagem
      buttonStyle: { backgroundColor: "#0F1A2C" },
      iconClass: "text-white",
      labelClass: "text-slate-900",
      isNavy: true,
    },
    {
      id: "deposit",
      icon: Plus,
      label: t("deposit"),
      buttonStyle: { backgroundColor: "#FFFFFF" },
      iconClass: "text-slate-700",
      labelClass: "text-slate-900",
      isNavy: false,
    },
    {
      id: "swap",
      icon: ArrowLeftRight,
      label: t("swap"),
      buttonStyle: { backgroundColor: "#FFFFFF" },
      iconClass: "text-slate-700",
      labelClass: "text-slate-900",
      isNavy: false,
    },
  ]

  return (
    <div className="flex gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.id === "pay" ? onPayBill : undefined}
          className="flex flex-1 flex-col items-center gap-2"
        >
          <div
            className="flex w-full h-16 items-center justify-center rounded-2xl border border-slate-200 transition-all active:scale-95 hover:opacity-90"
            style={action.buttonStyle}
          >
            <action.icon className={`h-6 w-6 ${action.iconClass}`} strokeWidth={1.8} />
          </div>
          <span className={`text-[12px] font-semibold ${action.labelClass}`}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
