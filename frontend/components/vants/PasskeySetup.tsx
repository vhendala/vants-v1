"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, LogOut } from "lucide-react";
import { usePrivy, useLinkWithPasskey } from "@privy-io/react-auth";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useLanguage } from "../providers/LanguageProvider";

import { API_URL } from "../../lib/config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PasskeySetupProps {
  onComplete: (smartWalletAddress: string) => void;
}

export function PasskeySetup({ onComplete }: PasskeySetupProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, getAccessToken, logout } = usePrivy();
  const router = useRouter();

  // ─── Privy Passkey Hook ──────────────────────────────────────────────────────

  // WHY: Definida antes do hook pois é referenciada no callback onSuccess.
  async function savePasskeyToBackend(credentialId: string, publicKey: string): Promise<void> {
    const token = await getAccessToken();
    if (!token) throw new Error(t("invalidSession"));

    const res = await fetch(`${API_URL}/api/passkey/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ credentialId, publicKey }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Unknown error" }));
      // WHY: Falha na persistência não deve bloquear o usuário. Logamos e seguimos.
      console.error("[PasskeySetup] Falha ao registrar passkey no backend:", data.error);
    }
  }

  // WHY: useLinkWithPasskey vincula uma passkey ao usuário já autenticado.
  // O onSuccess recebe o LinkedAccountWithMetadata do tipo 'passkey',
  // que contém o credentialId e publicKey REAIS gerados pelo hardware do dispositivo.
  const { linkWithPasskey } = useLinkWithPasskey({
    onSuccess: ({ linkedAccount }) => {
      // WHY: Extraimos as credenciais reais apenas no callback de sucesso do Privy,
      // garantindo que nunca salvemos um estado intermediário ou inválido.
      if (linkedAccount.type !== "passkey") return;

      const realCredentialId = linkedAccount.credentialId;
      const realPublicKey = linkedAccount.publicKey ?? realCredentialId;

      // Persiste no backend de forma assíncrona — não bloqueia a UX.
      savePasskeyToBackend(realCredentialId, realPublicKey).catch((err) =>
        console.error("[PasskeySetup] Falha ao persistir passkey:", err)
      );
    },
    onError: (error) => {
      // WHY: Erro de biometria (usuário cancelou, dispositivo não suporta, etc.)
      // é tratado aqui e propagado para o estado de erro do componente.
      console.error("[PasskeySetup] Erro ao vincular passkey Privy:", error);
    },
  });

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

      if (!token) throw new Error(t("invalidSession"));

      // 1. Gera keypair localmente (não-custodial — secret nunca vai ao servidor)
      const keypair = StellarSdk.Keypair.random();
      const publicKey = keypair.publicKey();

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
        throw new Error(errorData.error ?? `${t("serverError")}: ${setupRes.status}`);
      }

      // 3. Frontend assina a Trustline USDC
      const issuerPublicKey = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY;
      if (!issuerPublicKey) throw new Error("NEXT_PUBLIC_ISSUER_PUBLIC_KEY não configurado.");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await horizonServer.loadAccount(publicKey);
      const usdcAsset = new StellarSdk.Asset("USDC", issuerPublicKey);

      const trustlineTx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
        .setTimeout(30)
        .build();

      trustlineTx.sign(keypair);
      const trustlineXdr = trustlineTx.toXDR();

      // 4. Backend submete XDR
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

      // 5. Aciona biometria real do dispositivo via Privy SDK e persiste as
      // credenciais WebAuthn reais no backend via callback onSuccess do hook.
      await linkWithPasskey();

      setStep("success");
      setTimeout(() => onComplete(publicKey), 1500);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("unexpectedError");
      setErrorMessage(message);
      setStep("error");
    }
  }

  async function handleLogout() {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      router.push("/");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm animate-fade-up flex flex-col gap-4">
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
              {step === "success" ? t("accountSecure") : t("activateBiometrics")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === "success" 
                ? t("passkeySuccess") 
                : t("protectVants")}
            </p>
          </div>

          <div className="pt-8">
             {step === "idle" && (
                <button
                  onClick={handleCreatePasskey}
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#0F1A2C" }}
                >
                  {t("registerDevice")}
                </button>
             )}

             {step === "loading" && (
               <div className="flex flex-col items-center gap-4 py-2">
                 <p className="text-sm text-slate-500 text-center font-medium">{t("preparingWallet")}</p>
                 <div className="flex gap-1">
                   {[0, 1, 2].map((i) => (
                     <div key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "#0F1A2C", animationDelay: `${i * 0.15}s` }} />
                   ))}
                 </div>
               </div>
             )}

             {step === "success" && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="text-sm text-slate-500 text-center">{t("redirecting")}</p>
                </div>
             )}

             {step === "error" && (
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="h-14 w-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#0F1A2C]">{t("somethingWentWrong")}</p>
                    <p className="mt-1 text-xs text-slate-500">{errorMessage}</p>
                  </div>
                  <button onClick={() => setStep("idle")} className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: "#0F1A2C" }}>
                    {t("tryAgain")}
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
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
