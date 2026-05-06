"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { Language } from "../../lib/translations";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const langs: { id: Language; label: string; flag: string }[] = [
    { id: "en", label: "English", flag: "🇺🇸" },
    { id: "pt", label: "Português", flag: "🇧🇷" },
    { id: "es", label: "Español", flag: "🇪🇸" },
  ];

  const current = langs.find((l) => l.id === language) || langs[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-semibold text-[#0F1A2C]"
      >
        <span>{current.flag}</span>
        <span className="uppercase">{current.id}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-[60] animate-in fade-in zoom-in duration-200">
            {langs.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLanguage(l.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  language === l.id ? "font-bold text-[#0F1A2C]" : "text-slate-600"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
