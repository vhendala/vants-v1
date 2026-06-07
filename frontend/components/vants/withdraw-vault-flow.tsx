"use client";

/**
 * invest-flow.tsx
 *
 * WHY: Componente fullstack de investimento via Defindex Vault (USDC).
 * 4 steps: Valor → Revisão → Processamento → Sucesso.
 *
 * A tecnologia é 100% invisível para o usuário — nenhum jargão cripto.
 * O backend constrói a transação e o frontend assina com a chave local.
 *
 * Design System: sincronizado com landing-page-v2.html
 *   - Títulos: Zain 900
 *   - Textos: Manrope
 *   - Números: Inter tabular-nums 700
 *   - Cores: oklch palette (card-bg, green, blue, white, muted)
 *   - Botões: .btn-pill pattern
 *
 * @module withdraw-vault-flow
 */

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { usePrivy } from "@privy-io/react-auth";
import * as StellarSdk from "@stellar/stellar-sdk";
import { API_URL } from "../../lib/config";
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils";

interface WithdrawVaultFlowProps {
  onBack: () => void;
  publicKey?: string;
  currentApy?: number;
  investedBalance?: number | null;
}

type Step = "amount" | "review" | "processing" | "success";

const MIN_WITHDRAW = 0.01;

// ─── API Frontend: fetchWithdrawXdr ───────────────────────────────────────

async function fetchWithdrawXdr(
  amount: string,
  publicKey: string | undefined,
  token: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api/invest/build-withdraw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      publicKey,
      amount,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      (errData as any).error || "Não foi possível preparar sua aplicação. Tente novamente."
    );
  }

  const data = await res.json();
  return (data as any).xdr;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function WithdrawVaultFlow({ publicKey, onBack, currentApy = 7.5, investedBalance = 0 }: WithdrawVaultFlowProps) {
  const { t } = useLanguage();
  const { getAccessToken, user } = usePrivy();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const displayApy = currentApy.toFixed(1);

  // ─── Formatação do input USDC ──────────────────────────────────────────────

  const handleAmountChange = (rawValue: string) => {
    // Remove tudo exceto dígitos
    const digits = rawValue.replace(/\D/g, "");
    const numericValue = parseInt(digits || "0", 10) / 100;
    setAmount(numericValue.toFixed(2));
  };

  const formattedAmount = () => {
    const num = parseFloat(amount || "0");
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const numericAmount = parseFloat(amount || "0");
  const maxAmount = investedBalance || 0;
  const isValidAmount = numericAmount >= MIN_WITHDRAW && numericAmount <= maxAmount;

  // ─── Step 1 → Step 2 ──────────────────────────────────────────────────────

  const handleAdvanceToReview = () => {
    if (!isValidAmount) return;
    setError("");
    setStep("review");
  };

  // ─── Step 2 → Step 3: Processar resgate ───────────────────────────────────

  const handleConfirmWithdraw = useCallback(async () => {
    setStep("processing");
    setIsProcessing(true);
    setError("");

    try {
      // 1. Obter token de acesso Privy
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      // 2. Solicitar XDR ao backend
      const xdr = await fetchWithdrawXdr(amount, publicKey, token);

      // 3. Assinar a transação localmente
      const secret = await retrieveDecryptedSecret(user?.id || "");
      if (!secret) {
        throw new Error(
          "Chave da carteira não encontrada. Faça login novamente."
        );
      }

      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const tx = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        StellarSdk.Networks.TESTNET
      );
      tx.sign(keypair);
      const signedXdr = tx.toXDR();

      // 4. Submeter a transação assinada na Horizon
      const horizonServer = new StellarSdk.Horizon.Server(
        "https://horizon-testnet.stellar.org"
      );
      await horizonServer.submitTransaction(
        StellarSdk.TransactionBuilder.fromXDR(
          signedXdr,
          StellarSdk.Networks.TESTNET
        )
      );

      // 5. Sucesso!
      setStep("success");
    } catch (err: any) {
      console.error("[WithdrawVaultFlow] Erro ao processar resgate:", err);
      // Mensagens amigáveis — sem jargão
      let friendlyMessage = "Ocorreu um erro ao processar seu resgate. Tente novamente.";
      if (err.message?.includes("Sessão") || err.message?.includes("Chave")) {
        friendlyMessage = err.message;
      } else if (err.message?.includes("tx_failed") || err.message?.includes("op_underfunded")) {
        friendlyMessage = "Saldo insuficiente no cofre.";
      } else if (err.message?.includes("Network")) {
        friendlyMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      }
      setError(friendlyMessage);
      setStep("review"); // Volta para revisão para o usuário tentar de novo
    } finally {
      setIsProcessing(false);
    }
  }, [getAccessToken, amount, publicKey, user?.id]);

  // ─── Progress Bar ─────────────────────────────────────────────────────────

  const stepIndex = { amount: 0, review: 1, processing: 2, success: 3 };
  const progress = ((stepIndex[step] + 1) / 4) * 100;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col animate-in slide-in-from-right duration-300">
        {/* ── Progress Bar ─────────────────────────────────────────────── */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full rounded-r-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: step === "success"
                ? "var(--vants-green)"
                : "linear-gradient(90deg, var(--vants-blue-deep), var(--vants-blue))",
            }}
          />
        </div>

        {/* ── Header ──────────────────────────────────────────────────── */}
        {step !== "success" && step !== "processing" && (
          <header className="flex items-center justify-between px-4 py-4">
            <button
              onClick={step === "review" ? () => setStep("amount") : onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              style={{ color: "var(--vants-ink)" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span
              className="text-[15px] font-bold"
              style={{
                fontFamily: "'Manrope', sans-serif",
                color: "var(--vants-ink)",
              }}
            >
              Resgatar
            </span>
            <div className="w-10" />
          </header>
        )}

        {/* ── Erro global ─────────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 animate-in fade-in duration-300">
            <p className="text-[13px] text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1: Entrada de Valor
           ════════════════════════════════════════════════════════════════ */}
        {step === "amount" && (
          <main className="flex-1 flex flex-col px-5 pt-6">
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Label */}
              <p
                className="text-[13px] font-medium mb-6 tracking-wider uppercase"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  color: "var(--vants-muted)",
                }}
              >
                Quanto deseja resgatar?
              </p>

              {/* Input visual premium */}
              <div className="flex items-baseline gap-1 mb-2">
                <span
                  className="text-[24px] font-bold opacity-60"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "var(--vants-ink)",
                  }}
                >
                  $
                </span>
                <input
                  id="invest-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={formattedAmount()}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-center w-full max-w-[260px]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "48px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--vants-ink)",
                    caretColor: "var(--vants-blue)",
                  }}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Barra decorativa */}
              <div
                className="w-16 h-[3px] rounded-full mb-4 transition-colors duration-300"
                style={{
                  backgroundColor: isValidAmount
                    ? "var(--vants-blue)"
                    : "var(--vants-border)",
                }}
              />

              <div className="flex flex-col items-center gap-1 mb-8">
                <p
                  className="text-[13px]"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  Máximo: ${maxAmount.toFixed(2)} USDC
                </p>
                <button
                  onClick={() => handleAmountChange(maxAmount.toFixed(2).replace(".", ""))}
                  className="text-[12px] font-bold px-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
                  style={{ color: "var(--vants-blue)" }}
                >
                  Resgatar Máximo
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="pb-8">
              <button
                id="invest-advance-btn"
                onClick={handleAdvanceToReview}
                disabled={!isValidAmount}
                className="w-full h-[54px] rounded-[100px] font-semibold text-[16px] transition-all duration-250 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  backgroundColor: "var(--vants-blue-deep)",
                  color: "white",
                  border: "none",
                  cursor: isValidAmount ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (isValidAmount) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px oklch(30% 0.12 218 / 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Resgatar Agora →
              </button>
            </div>
          </main>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: Revisão
           ════════════════════════════════════════════════════════════════ */}
        {step === "review" && (
          <main className="flex-1 flex flex-col px-5 pt-4 pb-8">
            <div className="flex-1 flex flex-col">
              {/* Card de revisão — dark card bg como na landing page */}
              <div
                className="bg-white rounded-2xl p-6 mb-6 animate-in fade-in duration-500 border border-slate-200 shadow-sm"
              >
                {/* Título */}
                <p
                  className="text-[11px] font-bold tracking-[0.25em] uppercase mb-6 text-slate-500"
                >
                  Resumo do Resgate
                </p>

                {/* Valor principal */}
                <div className="text-center mb-6">
                  <p
                    className="mb-1 text-slate-900"
                    style={{
                      fontFamily: "'Zain', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    ${formattedAmount()}
                  </p>
                  <p
                    className="text-[14px] font-medium text-slate-500"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    USDC
                  </p>
                </div>

                {/* Separador */}
                <div
                  className="h-px w-full mb-5 bg-slate-100"
                />

                {/* Detalhes */}
                <div className="flex flex-col gap-4">
                  {/* Taxas */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[13px] font-medium text-slate-500"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Taxa de Resgate
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--vants-green)",
                      }}
                    >
                      Isento
                    </span>
                  </div>

                  {/* Tempo de processamento */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[13px] font-medium text-slate-500"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Tempo de Processamento
                    </span>
                    <span
                      className="text-[14px] font-semibold text-slate-900"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Imediato
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge de segurança */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
                style={{ backgroundColor: "oklch(56% 0.13 218 / 0.06)" }}
              >
                <Shield
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--vants-blue)" }}
                />
                <p
                  className="text-[12px] leading-relaxed"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  Seus fundos serão enviados instantaneamente para a sua carteira e estarão disponíveis para uso imediato.
                </p>
              </div>
            </div>

            {/* CTA: Confirmar */}
            <button
              id="invest-confirm-btn"
              onClick={handleConfirmWithdraw}
              disabled={isProcessing}
              className="w-full h-[54px] rounded-[100px] font-semibold text-[16px] transition-all duration-250 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                letterSpacing: "0.03em",
                backgroundColor: "var(--vants-green)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px oklch(52% 0.12 155 / 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Confirmar Resgate
            </button>
          </main>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3: Processamento
           ════════════════════════════════════════════════════════════════ */}
        {step === "processing" && (
          <main className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
              {/* Ícone de loading */}
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "oklch(56% 0.13 218 / 0.08)" }}
              >
                <Loader2
                  className="h-10 w-10 animate-spin"
                  style={{ color: "var(--vants-blue-deep)" }}
                />
              </div>

              <div className="text-center">
                <h2
                  className="text-[20px] font-bold mb-2"
                  style={{
                    fontFamily: "'Zain', sans-serif",
                    fontWeight: 900,
                    color: "var(--vants-ink)",
                  }}
                >
                  Resgatando...
                </h2>
                <p
                  className="text-[14px] max-w-[260px]"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  Estamos processando seu resgate com segurança.
                  Isso leva apenas alguns segundos.
                </p>
              </div>

              {/* Dots de loading */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2.5 w-2.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "var(--vants-blue-deep)",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: Sucesso
           ════════════════════════════════════════════════════════════════ */}
        {step === "success" && (
          <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
            <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-500">
              {/* Check verde */}
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "oklch(74% 0.13 155 / 0.15)" }}
              >
                <CheckCircle
                  className="h-10 w-10"
                  style={{ color: "var(--vants-green)" }}
                />
              </div>

              <div className="text-center">
                <h2
                  className="mb-2"
                  style={{
                    fontFamily: "'Zain', sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
                    lineHeight: 0.95,
                    letterSpacing: "-0.03em",
                    color: "var(--vants-ink)",
                  }}
                >
                  Resgate Concluído!
                </h2>
                <p
                  className="text-[14px] max-w-[280px]"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  Seu resgate foi processado e o saldo já está disponível na sua carteira.
                </p>
              </div>

              {/* Valor confirmado */}
              <div
                className="rounded-2xl px-8 py-5 text-center"
                style={{ backgroundColor: "oklch(74% 0.13 155 / 0.08)" }}
              >
                <p
                  className="text-[13px] font-medium mb-1"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  Valor Resgatado
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "32px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--vants-green)",
                  }}
                >
                  - ${formattedAmount()}
                </p>
              </div>
            </div>

            {/* CTA Voltar */}
            <div className="w-full mt-auto pt-8">
              <button
                id="invest-back-btn"
                onClick={onBack}
                className="w-full h-[54px] rounded-[100px] font-semibold text-[16px] transition-all duration-250 active:scale-[0.98]"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  backgroundColor: "var(--vants-blue-deep)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px oklch(30% 0.12 218 / 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Voltar ao Início
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
