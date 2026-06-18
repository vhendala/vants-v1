"use client"

import { CreditCard, Plus, ArrowLeftRight, RefreshCw } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"

interface QuickActionsProps {
  onPayBill?: () => void
  onTransfer?: () => void
  onDeposit?: () => void
  onConvert?: () => void
}

export function QuickActions({ onPayBill, onTransfer, onDeposit, onConvert }: QuickActionsProps) {
  const { t } = useLanguage()
  const actions = [
    {
      id: "pay",
      icon: CreditCard,
      label: t("pay"),
      buttonStyle: { backgroundColor: "var(--vants-blue-deep)" },
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
      id: "transfer",
      icon: ArrowLeftRight,
      label: t("transfer") || "Transferir",
      buttonStyle: { backgroundColor: "#FFFFFF" },
      iconClass: "text-slate-700",
      labelClass: "text-slate-900",
      isNavy: false,
    },
    {
      id: "convert",
      icon: RefreshCw,
      label: t("convert") || "Converter",
      buttonStyle: { backgroundColor: "#FFFFFF" },
      iconClass: "text-slate-700",
      labelClass: "text-slate-900",
      isNavy: false,
    },
  ]

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={
            action.id === "pay" ? onPayBill :
            action.id === "transfer" ? onTransfer :
            action.id === "deposit" ? onDeposit :
            action.id === "convert" ? onConvert : undefined
          }
          className="flex flex-1 flex-col items-center gap-2"
        >
          <div
            className="flex w-full h-14 items-center justify-center rounded-2xl border border-slate-200 transition-all active:scale-95 hover:opacity-90"
            style={action.buttonStyle}
          >
            <action.icon className={`h-5 w-5 ${action.iconClass}`} strokeWidth={1.8} />
          </div>
          <span className={`text-[11px] font-semibold ${action.labelClass}`}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}

