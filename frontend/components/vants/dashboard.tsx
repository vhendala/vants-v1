"use client";

/**
 * dashboard.tsx
 *
 * Ponto de entrada do app após autenticação.
 *
 * WHY: Este componente orquestra dois estados críticos:
 *   1. Usuário autenticado mas sem PIN → exibe PinSetup (onboarding)
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

// ─── Tipos ────────────────────────────────────────────────────────────────────

type View = "home" | "wallet" | "yield" | "profile" | "invest";

type AccountStatus =
  | { state: "loading" }
  | { state: "no-account" }
  | { state: "has-account"; publicKey: string };

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

// ─── Componente ───────────────────────────────────────────────────────────────

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
      const res = await fetch(`${BACKEND_URL}/api/account/status`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        // Falha silenciosa → trata como sem conta para não travar o onboarding
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
      // Falha de rede → trata como sem conta
      setAccountStatus({ state: "no-account" });
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (ready && authenticated) {
      fetchAccountStatus();
    } else if (ready && !authenticated) {
      // Usuário não autenticado: sem necessidade de checar status
      setAccountStatus({ state: "no-account" });
    }
  }, [ready, authenticated, fetchAccountStatus]);

  // ─── Guards de renderização ─────────────────────────────────────────────────

  // 1. Aguarda inicialização do SDK
  if (!ready) {
    return <DashboardSkeleton />;
  }

  // 2. Se não estiver autenticado, barrar imediatamente no botão de Login
  if (!authenticated) {
    return <LoginScreen onLogin={login} />;
  }

  // 3. Após autenticação Web2, aguardamos resolução do backend
  if (accountStatus.state === "loading") {
    return <DashboardSkeleton />;
  }

  // 4. Usuário logado mas sem biometria/conta backend ativa
  if (accountStatus.state === "no-account") {
    return (
      <PasskeySetup
        onComplete={(smartWalletAddress) =>
          setAccountStatus({ state: "has-account", publicKey: smartWalletAddress })
        }
      />
    );
  }

  // ─── Dashboard principal ─────────────────────────────────────────────────────

  if (showPayment) {
    return <PaymentView onBack={() => setShowPayment(false)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-md md:max-w-5xl md:flex md:gap-8 pb-32 md:pb-8 pt-4">
        {/* Nav Lateral no Desktop */}
        <aside className="hidden md:block w-64 shrink-0 px-4">
          <BottomNavigation activeView={activeView} onViewChange={setActiveView} />
        </aside>

        {/* Conteúdo principal */}
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

          {/* Nav Inferior no Mobile */}
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

// ─── Tela de Login ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <img src="/icon.svg" alt="Vants" className="h-16 w-16" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-widest">VANTS</h1>
          <p className="text-center text-muted-foreground text-sm leading-relaxed">
            Uma conta global para pagar o mundo real com os seus próprios investimentos
          </p>
        </div>

        <button
          id="login-btn"
          onClick={onLogin}
          className="w-full rounded-xl bg-[#6851FF] px-6 py-4 text-white font-semibold text-base
                     hover:bg-[#5a44d4] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-[#6851FF]/30"
        >
          Entrar ou criar conta
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Ao continuar, você concorda com os nossos{" "}
          <span className="underline cursor-pointer">Termos de Uso</span>
        </p>
      </div>
    </div>
  );
}
