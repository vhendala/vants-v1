"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

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

  // ─── Auxiliary WebAuthn Parser ──────────────────────────────────────────────
  
  function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = "";
    for (const charCode of bytes) {
      str += String.fromCharCode(charCode);
    }
    const base64String = btoa(str);
    return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  async function handleCreatePasskey() {
    setStep("loading");
    try {
      const email = resolveUserEmail(user);
      const userId = user?.id || "unknown-user-id";

      // 1. Configurações da Credencial FIDO2 (Secp256r1 é req para Soroban)
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "Vants App",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256 (secp256r1)
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // FaceID / TouchID / Windows Hello
          requireResidentKey: true,
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct", // Permite extrair o hardware data se necessário
      };

      // 2. Chama a biometria do sistema
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Criação de Passkey cancelada ou falhou.");
      }

      // 3. Extrai raw public key em Base64
      const response = credential.response as AuthenticatorAttestationResponse;
      let passkeyPublicKeyBase64 = "";

      // Browsers modernos fornecem o getPublicKey()
      if (typeof response.getPublicKey === "function") {
        const pubKeyBuffer = response.getPublicKey();
        if (pubKeyBuffer) {
          passkeyPublicKeyBase64 = bufferToBase64url(pubKeyBuffer);
        }
      }

      const passkeyCredentialId = credential.id;

      // Pegar token Privy para envio seguro
      const token = await getAccessToken();
      console.log("[PasskeySetup] Got Privy token, length:", token?.length);

      // 4. Salva a nova Identidade no Backend do Vants
      console.log("[PasskeySetup] Sending to backend:", {
        email,
        passkeyCredentialId: passkeyCredentialId.substring(0, 20) + "...",
        passkeyPublicKeyLength: passkeyPublicKeyBase64.length,
        apiUrl: API_URL,
      });

      const res = await fetch(`${API_URL}/api/account/secure`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
          passkeyCredentialId: passkeyCredentialId,
          passkeyPublicKey: passkeyPublicKeyBase64,
        }),
      });

      console.log("[PasskeySetup] Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("[PasskeySetup] Backend error response:", errorData);
        throw new Error(`Erro do servidor: ${res.status}`);
      }

      const successData = await res.json();
      console.log("[PasskeySetup] Success response:", successData);

      setStep("success");
      // Retorna string mock p/ simular sucesso on-UI até termos o contrato
      setTimeout(() => onComplete(successData.smartWalletAddress || "G_VANTS_PENDING_WALLET_..."), 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Card principal */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-br from-[#6851FF] to-[#4F46E5] px-6 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner shadow-white/10">
                {step === "loading" ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : step === "success" ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <Fingerprint className="h-8 w-8 text-white" />
                )}
              </div>
              <h1 className="text-xl font-bold text-white">
                {step === "success" ? "Conta segura!" : "Ativar Biometria"}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {step === "success" ? "Passkey configurado perfeitamente." : "Proteja seu aplicativo Vants com sua face ou digital."}
              </p>
            </div>
          </div>

          <div className="px-6 py-8">
             {step === "idle" && (
                <button
                  onClick={handleCreatePasskey}
                  className="w-full rounded-xl bg-[#6851FF] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#5842e6] active:scale-[0.98] shadow-md shadow-[#6851FF]/30"
                >
                  Registrar Dispositivo
                </button>
             )}

             {step === "loading" && (
               <div className="flex flex-col items-center gap-4 py-4">
                 <p className="text-sm text-slate-500 text-center">Aguardando confirmação do seu celular...</p>
                 <div className="flex gap-1">
                   {[0, 1, 2].map((i) => (
                     <div key={i} className="h-2 w-2 rounded-full bg-[#6851FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                   ))}
                 </div>
               </div>
             )}

             {step === "success" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm text-slate-500 text-center">Redirecionando para o seu painel…</p>
                </div>
             )}

             {step === "error" && (
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="h-14 w-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#081229]">Algo deu errado</p>
                    <p className="mt-1 text-xs text-slate-500">{errorMessage}</p>
                  </div>
                  <button onClick={() => setStep("idle")} className="w-full rounded-xl bg-[#6851FF] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#5842e6]">
                    Tentar novamente
                  </button>
                </div>
             )}
          </div>
        </div>

        {/* Botão "Sair" abaixo do card */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-200/80 text-slate-700 hover:bg-slate-300 transition-colors duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
