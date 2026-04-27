"use client"

import { User, CreditCard, Shield, Bell, Globe, HelpCircle, FileText, LogOut, ChevronRight } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"

export function ProfileView() {
  const { logout } = usePrivy()

  const accountLinks = [
    { id: "account", icon: User, label: "Account" },
    { id: "payment", icon: CreditCard, label: "Payment Preferences" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "language", icon: Globe, label: "Language", value: "English" },
  ]

  const supportLinks = [
    { id: "help", icon: HelpCircle, label: "Help Center" },
    { id: "terms", icon: FileText, label: "Terms & Privacy" },
  ]

  return (
    <main className="bg-[#F8FAFC] min-h-screen pb-28">
      {/* Cabeçalho */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-[32px] font-bold text-[#081329]">Profile</h1>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Profile Card principal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full shrink-0 shadow-md shadow-indigo-100" style={{ backgroundColor: "#6366F1" }}>
            <span className="text-white font-bold text-xl tracking-wider">WM</span>
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#081329]">Wlad Mendes</h2>
            <p className="text-[14px] text-slate-500 mb-0.5">wlad@vants.xyz</p>
            <p className="text-[11px] font-semibold text-slate-400">Member since Mar 2026</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">PAID</p>
            <p className="text-[16px] font-bold text-[#081329]">$245.00</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">EARNED</p>
            <p className="text-[16px] font-bold" style={{ color: "#10B981" }}>$47.82</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">STREAK</p>
            <p className="text-[16px] font-bold text-[#081329]">23 days</p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden divide-y divide-slate-100 mt-2">
          {accountLinks.map((link) => (
            <button key={link.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <link.icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-bold text-[14px] text-[#081329]">{link.label}</span>
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
            <button key={link.id} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <link.icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-bold text-[14px] text-[#081329]">{link.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-[20px] border border-red-100 overflow-hidden mt-2 mb-6">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>
            <span className="font-bold text-[14px] text-red-500">Logout</span>
          </button>
        </div>
      </div>
    </main>
  )
}
