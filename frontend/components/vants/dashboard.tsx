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
import { Mail } from "lucide-react";
import { usePrivy, useLoginWithEmail, useLoginWithOAuth } from "@privy-io/react-auth";
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
import { ProfileView } from "./profile-view";

import { API_URL } from "../../lib/config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type View = "home" | "invest" | "wallet" | "activity" | "profile";

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="max-w-md mx-auto w-full min-h-screen bg-white relative shadow-2xl overflow-x-hidden flex flex-col pb-20">
        
        <Header />

          {activeView === "home" && (
            <main className="px-4 py-4 flex flex-col gap-5 bg-white md:bg-slate-50">
              <BalanceCard />
              <InvestmentPools />
              <QuickActions onPayBill={() => setShowPayment(true)} />
              <RecentActivity />
            </main>
          )}

          {activeView === "invest" && <InvestmentsView />}

          {activeView === "wallet" && (
            <WalletView onPayBill={() => setShowPayment(true)} />
          )}

          {activeView === "activity" && <RecentActivity showFilters={true} />}

          {activeView === "profile" && <ProfileView />}

          {activeView === "profile" && <ProfileView />}

          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md bg-white border-t border-slate-200">
            <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
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
        <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#081329 transparent #081329 #081329" }} />
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

function LoginScreen() {
  const [step, setStep] = useState<"onboarding" | "login">("onboarding");
  const [otpStep, setOtpStep] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth } = useLoginWithOAuth();

  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[slideIndex];

  const handleNext = () => {
    if (isLastSlide) {
      setStep("login");
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) return;
    try {
      await sendCode({ email });
      setOtpStep(true);
    } catch (err) {
      console.error("Failed to send code:", err);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code) return;
    try {
      await loginWithCode({ code });
    } catch (err) {
      console.error("Failed to verify code:", err);
    }
  };

  const handleOAuth = (provider: "google" | "apple") => {
    initOAuth({ provider });
  };

  // Fundo Light Mode
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-background"
    >
      <div
        className="w-full max-w-sm"
        style={{ padding: "40px 16px 36px" }}
      >
        {step === "onboarding" ? (
          // ── Slides de Onboarding ────────────────────────────────────────────
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <span className="text-base font-extrabold tracking-[0.2em] text-foreground">
                VANTS
              </span>
              <button
                onClick={() => setStep("login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Tag — roxo acento, exclusivo do onboarding */}
            <p
              className="text-xs font-bold tracking-[0.15em] uppercase mb-6"
              style={{ color: "var(--vants-accent-purple)" }}
            >
              {slide.tag}
            </p>

            {/* Stat grande */}
            <p
              className="font-extrabold leading-none mb-1 text-foreground"
              style={{ fontSize: 64, letterSpacing: -2 }}
            >
              {slide.stat}
            </p>
            <p className="text-base text-muted-foreground mb-4">{slide.statSub}</p>

            {/* Barra roxa — acento decorativo do onboarding */}
            <div
              className="w-10 h-[3px] rounded-full mb-5"
              style={{ backgroundColor: "var(--vants-accent-purple)" }}
            />

            <h2 className="text-[1.75rem] font-bold leading-tight text-foreground mb-3 whitespace-pre-line">
              {slide.title}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-10">
              {slide.description}
            </p>

            {/* Indicadores + CTA */}
            <div className="flex items-center gap-1.5 mb-5">
              {ONBOARDING_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === slideIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
                  style={{
                    width: i === slideIndex ? 24 : 10,
                  }}
                />
              ))}
            </div>

            <button
              id="onboarding-cta-btn"
              onClick={handleNext}
              className="w-full h-[54px] rounded-[12px] text-white bg-primary font-semibold text-base tracking-wide transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
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
                onClick={() => {
                  if (otpStep) {
                    setOtpStep(false);
                  } else {
                    setStep("onboarding");
                  }
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-shadow hover:shadow-md bg-white border border-border"
              >
                <span
                  className="text-xl font-medium text-foreground leading-none"
                  style={{ marginTop: -2 }}
                >
                  ‹
                </span>
              </button>
            </div>

            {/* Logo */}
            <p className="text-xl font-extrabold tracking-[0.3em] text-foreground text-center mb-6">
              VANTS
            </p>

            {otpStep ? (
              // ── Fluxo OTP de Email ──────────────────────────────────────────
              <>
                <h1 className="text-[1.6rem] font-bold text-foreground text-center mb-1">
                  Check your email
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  We sent a secure login code to <b className="text-foreground">{email}</b>.
                </p>

                {/* Campo Código */}
                <div className="w-full mb-3">
                  <label className="block text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">
                    Login Code
                  </label>
                  <input
                    id="login-code-input"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                    className="w-full h-[50px] rounded-[12px] border border-border bg-white px-4 text-[15px] text-foreground placeholder-muted-foreground/50 outline-none focus:border-primary transition-colors tracking-[0.2em] font-medium text-center"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleCodeSubmit}
                  className="w-full h-[52px] rounded-[12px] text-white bg-primary font-semibold text-base mb-5 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                >
                  Verify Code
                </button>
              </>
            ) : (
              // ── Seleção Email / OAuth ───────────────────────────────────────
              <>
                <h1 className="text-[1.6rem] font-bold text-foreground text-center mb-1">
                  Create your account
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  Start earning in under a minute.
                </p>

                {/* Email */}
                <div className="w-full mb-3">
                  <label className="block text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="login-email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    className="w-full h-[50px] rounded-[12px] border border-border bg-white px-4 text-[15px] text-foreground placeholder-muted-foreground/50 outline-none focus:border-primary transition-colors"
                  />
                </div>

                <button
                  id="login-email-btn"
                  onClick={handleEmailSubmit}
                  className="w-full h-[52px] rounded-[12px] text-white bg-primary flex items-center justify-center gap-3 font-semibold text-base mb-5 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                >
                  <Mail className="w-5 h-5" />
                  Sign in with Email
                </button>

                {/* Divisor */}
                <div className="flex items-center gap-4 w-full mb-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Google */}
                <button
                  id="login-google-btn"
                  onClick={() => handleOAuth("google")}
                  className="w-full h-[52px] rounded-[12px] bg-white border border-border flex items-center justify-center gap-3 font-medium text-[15px] text-foreground mb-3 transition-all duration-150 hover:bg-muted active:scale-[0.98]"
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
                  onClick={() => handleOAuth("apple")}
                  className="w-full h-[52px] rounded-[12px] bg-white border border-border flex items-center justify-center gap-3 font-medium text-[15px] text-foreground mb-6 transition-all duration-150 hover:bg-muted active:scale-[0.98]"
                >
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                    <path d="M14.94 11.54c-.02-2.3 1.88-3.41 1.97-3.47-1.08-1.57-2.75-1.79-3.34-1.81-1.42-.14-2.77.83-3.49.83-.72 0-1.84-.81-3.02-.79-1.56.02-3 .9-3.8 2.29-1.63 2.81-.42 6.97 1.17 9.25.78 1.12 1.71 2.37 2.92 2.33 1.17-.05 1.62-.76 3.04-.76 1.42 0 1.83.76 3.07.74 1.26-.02 2.06-1.15 2.83-2.28.9-1.31 1.27-2.58 1.29-2.64-.03-.01-2.63-1.01-2.64-4z" fill="#000000"/>
                    <path d="M12.68 4.49c.65-.79 1.09-1.88 .97-2.99-.94.04-2.07.63-2.74 1.41-.6.69-1.13 1.8-.99 2.86 1.04.08 2.11-.53 2.76-1.28z" fill="#000000"/>
                  </svg>
                  Continue with Apple
                </button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By continuing you agree to our{" "}
                  <button
                    onClick={() => {}}
                    className="text-primary font-medium hover:underline"
                  >
                    Terms
                  </button>
                  {" "}and{" "}
                  <button
                    onClick={() => {}}
                    className="text-primary font-medium hover:underline"
                  >
                    Privacy Policy
                  </button>.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
