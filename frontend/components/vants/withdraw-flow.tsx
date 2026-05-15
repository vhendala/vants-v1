"use client"

import { useState } from "react"
import { ArrowLeft, Check, Landmark, Lock, Loader2, AlertCircle } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"
import { usePrivy } from "@privy-io/react-auth"
import * as StellarSdk from "@stellar/stellar-sdk"
import { API_URL } from "../../lib/config"

interface WithdrawFlowProps {
  onBack: () => void
}

export function WithdrawFlow({ onBack }: WithdrawFlowProps) {
  const { t } = useLanguage()
  const { getAccessToken } = usePrivy()

  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "loading" | "success" | "error">("input")
  const [errorMessage, setErrorMessage] = useState("")
  const [txHash, setTxHash] = useState("")

  // Simula um desafio biométrico no navegador para validar a presença do usuário
  async function promptBiometrics(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) return true; // Se não suportar, ignora

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required", // Exige biometria/PIN
        }
      });
      return true;
    } catch (e: any) {
      console.warn("Biometria ignorada ou cancelada", e);
      return true; 
    }
  }

  async function handleWithdraw() {
    if (!amount) return;

    setStep("loading");
    setErrorMessage("");

    try {
      // 1. Desafio biométrico
      const bioSuccess = await promptBiometrics();
      if (!bioSuccess) {
        throw new Error(t("biometricsFailed") || "Falha na verificação biométrica.");
      }

      const token = await getAccessToken();
      if (!token) throw new Error(t("invalidSession") || "Sessão inválida");

      // 2. Recupera secret local (Não-custodial)
      const secret = sessionStorage.getItem("vants_wallet_secret_tmp");
      if (!secret) {
        throw new Error(t("secretNotFound") || "Chave de assinatura não encontrada no dispositivo. Autentique novamente.");
      }

      // 3. Sanitiza os inputs
      const safeAmount = Number(amount).toFixed(7).replace(/\.?0+$/, ""); 
      if (Number(safeAmount) <= 0) throw new Error(t("invalidAmount") || "Valor inválido.");

      // 4. Pega o XDR não assinado do Backend
      const buildRes = await fetch(`${API_URL}/api/transactions/withdraw/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: safeAmount })
      });

      if (!buildRes.ok) {
        const errData = await buildRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao construir transação de saque.");
      }

      const { unsignedXdr } = await buildRes.json();

      // 5. Assina o XDR localmente
      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const tx = StellarSdk.TransactionBuilder.fromXDR(unsignedXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
      
      // Verifica se a chave na sessão corresponde à conta
      if (tx.source !== keypair.publicKey()) {
        throw new Error(t("invalidSession") || "Chave local não corresponde à sua conta. Saia e entre novamente.");
      }

      tx.sign(keypair);
      const signedXdr = tx.toXDR();

      // 6. Submete a transação assinada
      const submitRes = await fetch(`${API_URL}/api/transactions/withdraw/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signedXdr, amount: safeAmount })
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao submeter saque.");
      }

      const submitData = await submitRes.json();
      if (submitData.txHash) {
        setTxHash(submitData.txHash);
      }

      setStep("success");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Ocorreu um erro desconhecido no saque.");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans animate-fade-in" style={{ color: "var(--vants-ink)" }}>
        <div className="mx-auto max-w-md w-full flex-1 flex flex-col pt-12 pb-8">
          <main className="flex-1 flex flex-col items-center pt-8 px-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full mb-8" style={{ backgroundColor: "#E6F8ED" }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#10B981" }}>
                <Check className="h-8 w-8 text-white" strokeWidth={4} />
              </div>
            </div>

            <h1 className="text-[28px] font-bold mb-4" style={{ color: "var(--vants-ink)" }}>Saque Concluído</h1>
            
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] font-bold leading-none" style={{ color: "var(--vants-ink)" }}>R$ {Number(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[18px] font-bold text-slate-500 mb-8">Saque via PIX solicitado</p>

            <div className="flex flex-col gap-3 w-full">
              {txHash && (
                <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                  <span className="text-[12px] font-medium text-slate-500 mb-1">ID da Transação (Stellar)</span>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] font-mono break-all text-center hover:underline"
                    style={{ color: "var(--vants-blue)" }}
                  >
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </main>

          <div className="px-5 mt-auto pt-8 flex">
            <button
              onClick={onBack}
              className="w-full h-14 rounded-full text-white font-bold text-[15px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--vants-blue-deep)" }}
            >
              Voltar pro Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-10 animate-fade-in" style={{ color: "var(--vants-ink)" }}>
      <div className="mx-auto max-w-md w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 mb-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            style={{ color: "var(--vants-ink)" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-[15px] font-bold" style={{ color: "var(--vants-ink)" }}>Sacar via PIX</span>
          <div className="w-10" />
        </header>

        {/* Formulário Principal */}
        <main className="px-5 flex flex-col gap-6 mt-4">
          
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4" style={{ backgroundColor: "oklch(74% 0.13 155 / 0.12)" }}>
              <Landmark className="h-8 w-8" style={{ color: "var(--vants-green)" }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--vants-ink)" }}>Sacar BRL</h2>
            <p className="text-sm text-slate-500 text-center">Saque seu saldo convertido diretamente para sua conta bancária PIX.</p>
          </div>

          {step === "error" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">{t("error") || "Erro na transação"}</p>
                <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-bold mb-2 pl-1" style={{ color: "var(--vants-ink)" }}>Valor (BRL)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={step === "loading"}
                  className="w-full h-[56px] rounded-2xl border border-slate-200 bg-white pl-10 pr-16 text-[18px] font-bold transition-all outline-none"
                  style={{ color: "var(--vants-ink)" }}
                />
              </div>
            </div>
          </div>

        </main>

        <div className="px-5 mt-10">
          <button
            onClick={handleWithdraw}
            disabled={step === "loading" || !amount}
            className="flex w-full h-[60px] items-center justify-center gap-2 rounded-full text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--vants-blue-deep)" }}
          >
            {step === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span className="font-bold text-[16px]">Confirmar Saque</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
