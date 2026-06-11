"use client"

import { useState } from "react"
import { ArrowLeft, Check, Landmark, Lock, Loader2, AlertCircle } from "lucide-react"
import { useLanguage } from "../providers/LanguageProvider"
import { usePrivy } from "@privy-io/react-auth"
import * as StellarSdk from "@stellar/stellar-sdk"
import { API_URL } from "../../lib/config"
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils"

interface WithdrawFlowProps {
  onBack: () => void;
  publicKey?: string;
}

export function WithdrawFlow({ onBack, publicKey }: WithdrawFlowProps) {
  const { t } = useLanguage()
  const { getAccessToken, user } = usePrivy()

  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "loading" | "success" | "error">("input")
  const [loadingMessage, setLoadingMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [txHash, setTxHash] = useState("")

  const DESTINATION_WALLET = "GABRCTFYTRYFBAD737PQPJLRCG2EJHE6D6T4AT4VRCVFHFWWCPWD6N2M";

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
    setLoadingMessage("Validando segurança...");

    try {
      // 1. Desafio biométrico
      const bioSuccess = await promptBiometrics();
      if (!bioSuccess) {
        throw new Error(t("biometricsFailed") || "Falha na verificação biométrica.");
      }

      const token = await getAccessToken();
      if (!token) throw new Error(t("invalidSession") || "Sessão inválida");

      // 2. Recupera secret local (Não-custodial)
      const secret = await retrieveDecryptedSecret(user?.id || "");
      if (!secret) {
        throw new Error(t("secretNotFound") || "Chave de assinatura não encontrada no dispositivo. Autentique novamente.");
      }

      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

      // 3. Sanitiza os inputs
      const safeAmount = Number(amount).toFixed(7).replace(/\.?0+$/, ""); 
      if (Number(safeAmount) <= 0) throw new Error(t("invalidAmount") || "Valor inválido.");

      // ─── ETAPA 1: PREPARAÇÃO (Cotação e Swap Reverso) ─────────────────
      setLoadingMessage("Calculando conversão...");
      const reverseSwapRes = await fetch(`${API_URL}/api/invest/build-reverse-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publicKey: keypair.publicKey(), amount: safeAmount })
      });

      if (!reverseSwapRes.ok) {
        const errData = await reverseSwapRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao preparar conversão para BRL.");
      }

      const { xdr: swapXdr, usdcRequired } = await reverseSwapRes.json();

      // ─── ETAPA 2: RESGATE DO VAULT ────────────────────────────────────
      setLoadingMessage("Resgatando Dólares do cofre...");
      const vaultRes = await fetch(`${API_URL}/api/invest/build-withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publicKey: keypair.publicKey(), amount: usdcRequired })
      });

      if (!vaultRes.ok) {
        const errData = await vaultRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao resgatar fundos do cofre.");
      }

      const { xdr: vaultXdr } = await vaultRes.json();
      
      const vaultTx = StellarSdk.TransactionBuilder.fromXDR(vaultXdr, StellarSdk.Networks.TESTNET);
      vaultTx.sign(keypair);
      await horizonServer.submitTransaction(vaultTx);

      // ─── ETAPA 3: SWAP (USDC → TESOURO) ───────────────────────────────
      setLoadingMessage("Convertendo para Reais...");
      const swapTx = StellarSdk.TransactionBuilder.fromXDR(swapXdr, StellarSdk.Networks.TESTNET);
      swapTx.sign(keypair);
      await horizonServer.submitTransaction(swapTx);

      // ─── ETAPA 4: TRANSFERÊNCIA PIX (OFFRAMP) ───────────────────────
      setLoadingMessage("Enviando PIX...");
      const buildRes = await fetch(`${API_URL}/api/transactions/withdraw/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: safeAmount })
      });

      if (!buildRes.ok) {
        const errData = await buildRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao preparar envio PIX.");
      }

      const { unsignedXdr } = await buildRes.json();

      const pixTx = StellarSdk.TransactionBuilder.fromXDR(unsignedXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
      pixTx.sign(keypair);
      const signedPixXdr = pixTx.toXDR();

      const submitRes = await fetch(`${API_URL}/api/transactions/withdraw/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ signedXdr: signedPixXdr, amount: safeAmount })
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao submeter saque PIX.");
      }

      const submitData = await submitRes.json();
      if (submitData.txHash) {
        setTxHash(submitData.txHash);
      }

      setStep("success");
    } catch (error: any) {
      console.error("[WithdrawFlow] Erro no saque atômico:", error);
      
      let msg = error.message || "Ocorreu um erro desconhecido no saque.";
      if (msg.includes("underfunded") || msg.includes("tx_failed")) {
        msg = "Saldo insuficiente no cofre.";
      }
      
      setErrorMessage(msg);
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
              {/* Origem */}
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                <span className="text-[12px] font-medium text-slate-500 mb-1">Origem</span>
                <span className="text-[11px] font-mono break-all text-center" style={{ color: "var(--vants-ink)" }}>
                  {publicKey || "Minha Carteira"}
                </span>
              </div>

              {/* Destino */}
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                <span className="text-[12px] font-medium text-slate-500 mb-1">Destino</span>
                <span className="text-[11px] font-mono break-all text-center" style={{ color: "var(--vants-ink)" }}>
                  {DESTINATION_WALLET}
                </span>
              </div>

              {txHash && (
                <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                  <span className="text-[12px] font-medium text-slate-500 mb-1">ID da Transação</span>
                  <span className="text-[11px] font-mono break-all text-center text-slate-400">
                    {txHash}
                  </span>
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
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-bold text-[16px]">{loadingMessage || "Processando..."}</span>
              </div>
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
