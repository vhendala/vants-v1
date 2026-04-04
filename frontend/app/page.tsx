"use client"

import { useState } from "react"
import { VantsDashboard } from "@/components/vants/dashboard"
import { ThemeProvider } from "@/components/vants/theme-provider"

export default function Home() {
  return (
    <ThemeProvider>
      <VantsDashboard />
    </ThemeProvider>
  )
}
