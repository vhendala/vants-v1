"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "../../lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Carrega o idioma salvo ou detecta o do navegador no mount
  useEffect(() => {
    const saved = localStorage.getItem("vants_lang") as Language;
    if (saved && (saved === "en" || saved === "pt" || saved === "es")) {
      setLanguageState(saved);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "pt") setLanguageState("pt");
      else if (browserLang === "es") setLanguageState("es");
      else setLanguageState("en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("vants_lang", lang);
  };

  const t = (key: keyof typeof translations.en) => {
    const translation = translations[language][key];
    return translation || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
