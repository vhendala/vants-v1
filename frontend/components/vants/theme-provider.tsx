"use client"

import * as React from "react"

type Theme = "dark" | "light"

const THEME_STORAGE_KEY = "vants-theme"
const DEFAULT_THEME: Theme = "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME)

  // On mount: read from localStorage and sync to <html> class
  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const resolved = stored === "light" || stored === "dark" ? stored : DEFAULT_THEME
    applyTheme(resolved)
    setThemeState(resolved)
  }, [])

  const applyTheme = (next: Theme) => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(next)
  }

  const setTheme = (next: Theme) => {
    applyTheme(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setThemeState(next)
  }

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
