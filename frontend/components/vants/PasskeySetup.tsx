"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Keypair } from "@stellar/stellar-sdk";

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

      // 4. Gerar Carteira Não-Custodial (Stellar)
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();
      const secret = keypair.secret();

      // Armazenamento Local (Criptografado ou Seguro conforme requisito)
      localStorage.setItem("vants_wallet_public_key", publicKey);
      localStorage.setItem("vants_wallet_secret", secret); // Em prod, usar criptografia baseada no PIN/Passkey

      // 5. Salva a nova Identidade e ativa a carteira no Backend
      console.log("[PasskeySetup] Setup logic:", {
        email,
        publicKey,
        apiUrl: API_URL,
      });

      const res = await fetch(`${API_URL}/api/account/setup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          publicKey: publicKey,
        }),
      });

      console.log("[PasskeySetup] Setup response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("[PasskeySetup] Backend error response:", errorData);
        throw new Error(`Erro do servidor: ${res.status}`);
      }

      const successData = await res.json();
      console.log("[PasskeySetup] Setup Success response:", successData);

      setStep("success");
      // Retorna a chave pública para o dashboard
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm animate-fade-up flex flex-col gap-4">
        {/* Card principal */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden px-6 py-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              {step === "loading" ? (
                <Loader2 className="h-8 w-8 text-[#081329] animate-spin" />
              ) : step === "success" ? (
                <CheckCircle className="h-8 w-8 text-[#10B981]" />
              ) : (
                <Fingerprint className="h-8 w-8 text-[#081329]" />
              )}
            </div>
            
            <h1 className="text-xl font-bold text-[#081329]">
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
                  style={{ backgroundColor: "#081329" }}
                >
                  Registrar Dispositivo
                </button>
             )}

             {step === "loading" && (
               <div className="flex flex-col items-center gap-4 py-2">
                 <p className="text-sm text-slate-500 text-center font-medium">Preparando sua carteira...</p>
                 <div className="flex gap-1">
                   {[0, 1, 2].map((i) => (
                     <div key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: "#081329", animationDelay: `${i * 0.15}s` }} />
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
                    <p className="text-sm font-bold text-[#081329]">Algo deu errado</p>
                    <p className="mt-1 text-xs text-slate-500">{errorMessage}</p>
                  </div>
                  <button onClick={() => setStep("idle")} className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: "#081329" }}>
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
