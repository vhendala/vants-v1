"use client"

import { User, CreditCard, Shield, Bell, Globe, HelpCircle, FileText, LogOut, ChevronRight } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useLanguage } from "../providers/LanguageProvider"

export function ProfileView() {
  const { t } = useLanguage()
  const { user, logout } = usePrivy()

  // Resolve user display info
  const userEmail = user?.email?.address || user?.google?.email || user?.apple?.email || "user@vants.xyz"
  const userName = user?.google?.name || user?.apple?.name || userEmail.split("@")[0]

  const accountLinks = [
    { id: "account", icon: User, label: t("account") },
    { id: "payment", icon: CreditCard, label: t("paymentPreferences") },
    { id: "security", icon: Shield, label: t("security") },
    { id: "notifications", icon: Bell, label: t("notifications") as string || "Notifications" },
    { id: "language", icon: Globe, label: t("language") as string || "Language", value: t("profile") },
  ]

  const supportLinks = [
    { id: "help", icon: HelpCircle, label: t("helpCenter") },
    { id: "terms", icon: FileText, label: t("termsPrivacy") },
  ]

  return (
    <main className="bg-[#F8FAFC] min-h-screen pb-28">
      {/* Cabeçalho */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-[32px] font-bold text-[#0F1A2C]">{t("profile")}</h1>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Profile Card principal — Removido iniciais WM, trocado por Ícone User */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full shrink-0 shadow-md shadow-indigo-100 bg-slate-100">
            <User className="h-8 w-8 text-[#0F1A2C]" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#0F1A2C] capitalize">{userName}</h2>
            <p className="text-[14px] text-slate-500 mb-0.5">{userEmail}</p>
            <p className="text-[11px] font-semibold text-slate-400">{t("memberSince")} Mar 2026</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">{t("paid")}</p>
            <p className="text-[16px] font-bold text-[#0F1A2C]">$0.00</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">{t("earned")}</p>
            <p className="text-[16px] font-bold" style={{ color: "#10B981" }}>$0.00</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">{t("streak")}</p>
            <p className="text-[16px] font-bold text-[#0F1A2C]">0 {t("days")}</p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden divide-y divide-slate-100 mt-2">
          {accountLinks.map((link) => (
            <button key={link.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <link.icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-bold text-[14px] text-[#0F1A2C]">{link.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {link.value && <span className="text-[13px] text-slate-500">{link.value}</span>}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Support Settings */}
        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden divide-y divide-slate-100 mt-2">
          {supportLinks.map((link) => (
            <button key={link.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <link.icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-bold text-[14px] text-[#0F1A2C]">{link.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-[20px] border border-red-100 overflow-hidden mt-2 mb-6">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>
            <span className="font-bold text-[14px] text-red-500">{t("logout")}</span>
          </button>
        </div>
      </div>
    </main>
  )
}
