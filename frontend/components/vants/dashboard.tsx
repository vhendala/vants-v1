"use client";

/**
 * dashboard.tsx
 *
 * Ponto de entrada do app após autenticação.
 *
 * WHY: Este componente orquestra dois estados críticos:
 *   1. Usuário autenticado mas sem conta → exibe PasskeySetup (onboarding)
 *   2. Usuário com conta configurada → exibe o dashboard completo
 *
 * A checagem de /api/account/status é feita uma única vez no mount para
 * evitar re-renders desnecessários e não bloquear a UI principal.
 */

import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "./header";
import { BalanceCard } from "./balance-card";
import { QuickActions } from "./quick-actions";
import { InvestmentPools } from "./investment-pools";
import { RecentActivity } from "./recent-activity";
import { BottomNavigation } from "./bottom-navigation";
import { InvestmentsView } from "./investments-view";
import { PaymentView } from "./payment-view";
import { WalletView } from "./wallet-view";
import { PasskeySetup } from "./PasskeySetup";

import { API_URL } from "../../lib/config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type View = "home" | "wallet" | "yield" | "profile" | "invest";

type AccountStatus =
  | { state: "loading" }
  | { state: "no-account" }
  | { state: "has-account"; publicKey: string };

// ─── Componente principal ─────────────────────────────────────────────────────

export function VantsDashboard() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [activeView, setActiveView] = useState<View>("home");
  const [showPayment, setShowPayment] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({
    state: "loading",
  });

  /**
   * Busca o status da conta no backend uma única vez após autenticação.
   * Usa o token de acesso Privy como bearer para autorização.
   */
  const fetchAccountStatus = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/account/status`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        setAccountStatus({ state: "no-account" });
        return;
      }

      const data: { hasAccount: boolean; publicKey?: string } = await res.json();

      setAccountStatus(
        data.hasAccount && data.publicKey
          ? { state: "has-account", publicKey: data.publicKey }
          : { state: "no-account" }
      );
    } catch {
      setAccountStatus({ state: "no-account" });
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (ready && authenticated) {
      fetchAccountStatus();
    } else if (ready && !authenticated) {
      setAccountStatus({ state: "no-account" });
    }
  }, [ready, authenticated, fetchAccountStatus]);

  // ─── Guards ───────────────────────────────────────────────────────────────────

  if (!ready) return <DashboardSkeleton />;

  if (!authenticated) return <LoginScreen onLogin={login} />;

  if (accountStatus.state === "loading") return <DashboardSkeleton />;

  if (accountStatus.state === "no-account") {
    return (
      <PasskeySetup
        onComplete={(smartWalletAddress) =>
          setAccountStatus({ state: "has-account", publicKey: smartWalletAddress })
        }
      />
    );
  }

  if (showPayment) {
    return <PaymentView onBack={() => setShowPayment(false)} />;
  }

  // ─── Dashboard principal ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-md md:max-w-5xl md:flex md:gap-8 pb-32 md:pb-8 pt-4">
        <aside className="hidden md:block w-64 shrink-0 px-4">
          <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
        </aside>

        <div className="flex-1 w-full max-w-md md:max-w-full mx-auto md:mx-0 relative">
          <Header />

          {activeView === "home" && (
            <main className="px-4 py-4 flex flex-col gap-6">
              <BalanceCard />
              <QuickActions onPayBill={() => setShowPayment(true)} />
              <InvestmentPools />
              <RecentActivity />
            </main>
          )}

          {activeView === "invest" && <InvestmentsView />}

          {activeView === "wallet" && (
            <WalletView onPayBill={() => setShowPayment(true)} />
          )}

          {activeView === "yield" && (
            <main className="px-4 py-4">
              <div className="flex h-64 items-center justify-center rounded-xl bg-card border border-border">
                <p className="text-muted-foreground font-semibold">Markets View</p>
              </div>
            </main>
          )}

          {activeView === "profile" && (
            <main className="px-4 py-4">
              <div className="flex h-64 items-center justify-center rounded-xl bg-card border border-border">
                <p className="text-muted-foreground font-semibold">Settings View</p>
              </div>
            </main>
          )}

          <div className="md:hidden">
            <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton de carregamento ──────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-[#6851FF] border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Carregando…</p>
      </div>
    </div>
  );
}

// ─── Dados dos slides de onboarding ───────────────────────────────────────────

const ONBOARDING_SLIDES = [
  {
    tag: "GROW YOUR MONEY",
    stat: "12%",
    statSub: "annual return",
    title: "Earn up to\n12% a year",
    description:
      "High-yield accounts that outperform your bank — without the complexity.",
  },
  {
    tag: "ALWAYS ON",
    stat: "24/7",
    statSub: "growing",
    title: "Your money\nnever sleeps",
    description:
      "Your money grows every second, day and night. Available anytime, no waiting.",
  },
  {
    tag: "PAY SMARTER",
    stat: "$0",
    statSub: "conversion fees",
    title: "Pay any bill\nin seconds",
    description: "Convert just enough to cover it. The rest keeps earning.",
  },
];

// ─── Tela de Login (onboarding + login num card centralizado) ─────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<"onboarding" | "login">("onboarding");
  const [slideIndex, setSlideIndex] = useState(0);
  const [email, setEmail] = useState("");

  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[slideIndex];

  const handleNext = () => {
    if (isLastSlide) {
      setStep("login");
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  // Fundo cinza claro + card branco centralizado (igual à tela de login)
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F0F2F5" }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm"
        style={{ padding: "40px 32px 36px" }}
      >
        {step === "onboarding" ? (
          // ── Slides de Onboarding ────────────────────────────────────────────
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <span className="text-base font-extrabold tracking-[0.2em] text-[#0D1117]">
                VANTS
              </span>
              <button
                onClick={() => setStep("login")}
                className="text-sm font-medium text-[#8E9AAD] hover:text-[#0D1117] transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Tag */}
            <p
              className="text-xs font-bold tracking-[0.15em] uppercase mb-6"
              style={{ color: "#6C63FF" }}
            >
              {slide.tag}
            </p>

            {/* Stat grande */}
            <p
              className="font-extrabold leading-none mb-1 text-[#0D1117]"
              style={{ fontSize: 64, letterSpacing: -2 }}
            >
              {slide.stat}
            </p>
            <p className="text-base text-[#8E9AAD] mb-4">{slide.statSub}</p>

            {/* Barra roxa */}
            <div
              className="w-10 h-[3px] rounded-full mb-5"
              style={{ backgroundColor: "#6C63FF" }}
            />

            <h2 className="text-[1.75rem] font-bold leading-tight text-[#0D1117] mb-3 whitespace-pre-line">
              {slide.title}
            </h2>
            <p className="text-base text-[#8E9AAD] leading-relaxed mb-10">
              {slide.description}
            </p>

            {/* Indicadores + CTA */}
            <div className="flex items-center gap-1.5 mb-5">
              {ONBOARDING_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === slideIndex ? 24 : 10,
                    backgroundColor: i === slideIndex ? "#6C63FF" : "#D0D7E3",
                  }}
                />
              ))}
            </div>

            <button
              id="onboarding-cta-btn"
              onClick={handleNext}
              className="w-full h-[54px] rounded-full text-white font-semibold text-base tracking-wide transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#0D1117" }}
            >
              {isLastSlide ? "Get Started →" : "Continue →"}
            </button>
          </>
        ) : (
          // ── Tela de Login ───────────────────────────────────────────────────
          <>
            {/* Botão voltar */}
            <div className="mb-8">
              <button
                onClick={() => setStep("onboarding")}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: "#F0F2F5",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                }}
              >
                <span
                  className="text-xl font-medium text-[#0D1117] leading-none"
                  style={{ marginTop: -2 }}
                >
                  ‹
                </span>
              </button>
            </div>

            {/* Logo */}
            <p className="text-xl font-extrabold tracking-[0.3em] text-[#0D1117] text-center mb-6">
              VANTS
            </p>

            <h1 className="text-[1.6rem] font-bold text-[#0D1117] text-center mb-1">
              Create your account
            </h1>
            <p className="text-sm text-[#8E9AAD] text-center mb-8">
              Start earning in under a minute.
            </p>

            {/* Email */}
            <div className="w-full mb-3">
              <label className="block text-[11px] font-bold tracking-[0.12em] uppercase text-[#8E9AAD] mb-2">
                Email
              </label>
              <input
                id="login-email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onLogin()}
                className="w-full h-[50px] rounded-xl border-[1.5px] border-[#D0D7E3] bg-white px-4 text-[15px] text-[#0D1117] placeholder-[#B0BAC9] outline-none focus:border-[#6C63FF] transition-colors"
              />
            </div>

            <button
              id="login-email-btn"
              onClick={onLogin}
              className="w-full h-[52px] rounded-full text-white font-semibold text-base mb-5 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#0D1117" }}
            >
              Continue with Email
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-4 w-full mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
              <span className="text-sm text-[#8E9AAD]">or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#E2E8F0" }} />
            </div>

            {/* Google */}
            <button
              id="login-google-btn"
              onClick={onLogin}
              className="w-full h-[52px] rounded-full bg-white border-[1.5px] border-[#E2E8F0] flex items-center justify-center gap-3 font-medium text-[15px] text-[#0D1117] mb-3 transition-all duration-150 hover:shadow-md active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path d="M43.6 20.5H42V20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" fill="#FFC107"/>
                <path d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" fill="#FF3D00"/>
                <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.5-3-11.3-7.3L6 33.6C9.4 39.6 16.1 44 24 44z" fill="#4CAF50"/>
                <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37 39.5 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" fill="#1976D2"/>
              </svg>
              Continue with Google
            </button>

            {/* Apple */}
            <button
              id="login-apple-btn"
              onClick={onLogin}
              className="w-full h-[52px] rounded-full flex items-center justify-center gap-3 font-medium text-[15px] text-white mb-6 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#0D1117" }}
            >
              <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                <path d="M14.94 11.54c-.02-2.3 1.88-3.41 1.97-3.47-1.08-1.57-2.75-1.79-3.34-1.81-1.42-.14-2.77.83-3.49.83-.72 0-1.84-.81-3.02-.79-1.56.02-3 .9-3.8 2.29-1.63 2.81-.42 6.97 1.17 9.25.78 1.12 1.71 2.37 2.92 2.33 1.17-.05 1.62-.76 3.04-.76 1.42 0 1.83.76 3.07.74 1.26-.02 2.06-1.15 2.83-2.28.9-1.31 1.27-2.58 1.29-2.64-.03-.01-2.63-1.01-2.64-4z" fill="white"/>
                <path d="M12.68 4.49c.65-.79 1.09-1.88 .97-2.99-.94.04-2.07.63-2.74 1.41-.6.69-1.13 1.8-.99 2.86 1.04.08 2.11-.53 2.76-1.28z" fill="white"/>
              </svg>
              Continue with Apple
            </button>

            {/* Termos */}
            <p className="text-xs text-[#8E9AAD] text-center leading-relaxed">
              By continuing you agree to our{" "}
              <button
                onClick={onLogin}
                className="text-[#6C63FF] font-medium hover:underline"
              >
                Terms
              </button>
              {" "}and{" "}
              <button
                onClick={onLogin}
                className="text-[#6C63FF] font-medium hover:underline"
              >
                Privacy Policy
              </button>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
