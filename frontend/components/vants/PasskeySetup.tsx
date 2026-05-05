"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import * as StellarSdk from "@stellar/stellar-sdk";

import { API_URL } from "../../lib/config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PasskeySetupProps {
  onComplete: (smartWalletAddress: string) => void;
}

export function PasskeySetup({ onComplete }: PasskeySetupProps) {
  const [step, setStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, getAccessToken, logout } = usePrivy();
  const router = useRouter();

  function resolveUserEmail(user: any): string {
    if (!user) return "user@domain.xyz";
    if (user.email?.address) return user.email.address;
    if (user.google?.email) return user.google.email;
    if (user.apple?.email) return user.apple.email;
    return "user@domain.xyz";
  }

  async function handleCreatePasskey() {
    setStep("loading");
    try {
      const email = resolveUserEmail(user);
      const token = await getAccessToken();

      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      // 1. Gera keypair localmente (não-custodial — secret nunca vai ao servidor)
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();

      // WHY: sessionStorage é escopado à aba e não persiste entre sessões.
      // Em produção deve ser criptografado com PIN do usuário.
      sessionStorage.setItem("vants_wallet_public_key", publicKey);
      sessionStorage.setItem("vants_wallet_secret_tmp", keypair.secret());

      // 2. Backend ativa a conta via Friendbot
      const setupRes = await fetch(`${API_URL}/api/account/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ publicKey, email }),
      });

      if (!setupRes.ok) {
        const errorData = await setupRes.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error ?? `Erro do servidor: ${setupRes.status}`);
      }

      console.log("[PasskeySetup] Friendbot activation successful");

      // 3. Frontend assina a Trustline USDC (não-custodial)
      const issuerPublicKey = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY;
      if (!issuerPublicKey) throw new Error("NEXT_PUBLIC_ISSUER_PUBLIC_KEY não configurado.");

      // WHY: Aguarda a conta propagar no Horizon antes de loadAccount.
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await horizonServer.loadAccount(publicKey);

      // WHY: Asset instanciado aqui (lazy) — evita erro de module evaluation
      // quando a env ainda não foi resolvida pelo Next.js.
      const usdcAsset = new StellarSdk.Asset("USDC", issuerPublicKey);

      const trustlineTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
        .setTimeout(30)
        .build();

      // Assina com a chave do usuário — nunca enviada ao servidor
      trustlineTx.sign(keypair);
      const trustlineXdr = trustlineTx.toXDR();

      console.log("[PasskeySetup] Trustline signed, submitting via backend");

      // 4. Backend submete XDR + emite 10.000 USDC (mock Hi-Li PIX)
      const fundRes = await fetch(`${API_URL}/api/account/fund-usdc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ trustlineXdr }),
      });

      if (!fundRes.ok) {
        const errorData = await fundRes.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error ?? `Erro HTTP ${fundRes.status}`);
      }

      console.log("[PasskeySetup] USDC funded successfully");

      setStep("success");
      setTimeout(() => onComplete(publicKey), 1500);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Erro inesperado.";
      setErrorMessage(message);
      setStep("error");
    }
  }

  async function handleLogout() {
    try {
      console.log("[PasskeySetup] Logging out...");
      await logout();
      console.log("[PasskeySetup] Logout successful, redirecting to home");
      router.push("/");
    } catch (err) {
      console.error("[PasskeySetup] Logout error:", err);
      // Fallback redirect even if logout fails
      router.push("/");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm animate-fade-up flex flex-col gap-4">
        {/* Card principal */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden px-6 py-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              {step === "loading" ? (
                <Loader2 className="h-8 w-8 text-[#0F1A2C] animate-spin" />
              ) : step === "success" ? (
                <CheckCircle className="h-8 w-8 text-[#10B981]" />
              ) : (
                <Fingerprint className="h-8 w-8 text-[#0F1A2C]" />
              )}
            </div>
            
            <h1 className="text-xl font-bold text-[#0F1A2C]">
              {step === "success" ? "Conta segura!" : "Ativar Biometria"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === "success" 
                ? "Passkey configurado perfeitamente." 
                : "Proteja seu aplicativo Vants com sua face ou digital."}
            </p>
          </div>

          <div className="pt-8">
             {step === "idle" && (
                <button
                  onClick={handleCreatePasskey}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#0F1A2C" }}
                >
                  Registrar Dispositivo
                </button>
             )}

             {step === "loading" && (
               <div className="flex flex-col items-center gap-4 py-2">
                 <p className="text-sm text-slate-500 text-center font-medium">Preparando sua carteira...</p>
                 <div className="flex gap-1">
                   {[0, 1, 2].map((i) => (
                     <div key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "#0F1A2C", animationDelay: `${i * 0.15}s` }} />
                   ))}
                 </div>
               </div>
             )}

             {step === "success" && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="text-sm text-slate-500 text-center">Redirecionando para o seu painel…</p>
                </div>
             )}

             {step === "error" && (
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="h-14 w-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#0F1A2C]">Algo deu errado</p>
                    <p className="mt-1 text-xs text-slate-500">{errorMessage}</p>
                  </div>
                  <button onClick={() => setStep("idle")} className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: "#0F1A2C" }}>
                    Tentar novamente
                  </button>
                </div>
             )}
          </div>
        </div>

        {/* Botão "Sair" abaixo do card */}
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors duration-200 text-sm font-medium shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
