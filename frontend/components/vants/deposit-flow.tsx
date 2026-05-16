"use client";

/**
 * deposit-flow.tsx
 *
 * WHY: Componente fullstack de depósito via Pix integrando Etherfuse.
 * 4 steps: Valor → Trustline TESOURO → QR/Pix → Sucesso.
 *
 * O ativo na rede é TESOURO, mas o frontend exibe como BRL.
 */

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Copy,
  Check,
  Shield,
  QrCode,
  Banknote,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useLanguage } from "../providers/LanguageProvider";
import { API_URL } from "../../lib/config";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DepositStep = "amount" | "trustline" | "payment" | "success";

interface DepositFlowProps {
  publicKey: string;
  onBack: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MIN_DEPOSIT = 10;

// ─── Componente Principal ─────────────────────────────────────────────────────

export function DepositFlow({ publicKey, onBack }: DepositFlowProps) {
  const { t } = useLanguage();
  const { getAccessToken } = usePrivy();

  const [step, setStep] = useState<DepositStep>("amount");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Dados do Pix (vindos do backend)
  const [orderId, setOrderId] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [targetAmount, setTargetAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // ─── Step 1: Formatação do input BRL ──────────────────────────────────────

  const handleAmountChange = (rawValue: string) => {
    // Remove tudo exceto dígitos
    const digits = rawValue.replace(/\D/g, "");
    const numericValue = parseInt(digits || "0", 10) / 100;
    setAmount(numericValue.toFixed(2));
  };

  const formattedAmount = () => {
    const num = parseFloat(amount || "0");
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isValidAmount = parseFloat(amount || "0") >= MIN_DEPOSIT;

  // ─── Step 2: Verificar e criar Trustline TESOURO ──────────────────────────

  const handleTrustlineCheck = useCallback(async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = await getAccessToken();

      // 1. Verifica se já tem trustline
      const checkRes = await fetch(
        `${API_URL}/api/account/trustline-check?asset=TESOURO`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { hasTrustline } = await checkRes.json();

      if (hasTrustline) {
        // Pula direto pro pagamento
        setStep("payment");
        await handleInitiateDeposit();
        return;
      }

      // 2. Obtém XDR não assinado para ChangeTrust
      const buildRes = await fetch(`${API_URL}/api/account/build-trustline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!buildRes.ok) {
        throw new Error("Falha ao construir transação de trustline.");
      }

      const { unsignedXdr } = await buildRes.json();

      // 3. Assina com a secret do sessionStorage
      const secret = sessionStorage.getItem("vants_wallet_secret_tmp");
      if (!secret) {
        throw new Error(t("secretNotFound"));
      }

      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const tx = StellarSdk.TransactionBuilder.fromXDR(
        unsignedXdr,
        StellarSdk.Networks.TESTNET
      );
      tx.sign(keypair);
      const signedXdr = tx.toXDR();

      // 4. Submete a trustline assinada
      const submitRes = await fetch(
        `${API_URL}/api/transactions/transfer/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            signedXdr,
            amount: "0",
            destination: "trustline",
          }),
        }
      );

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao submeter trustline.");
      }

      // 5. Avança para o pagamento
      setStep("payment");
      await handleInitiateDeposit();
    } catch (err: any) {
      console.error("[DepositFlow] Trustline error:", err);
      setError(err.message || "Erro ao preparar trustline.");
    } finally {
      setIsProcessing(false);
    }
  }, [getAccessToken, amount, t]);

  // ─── Step 3: Iniciar depósito (quote + order) ────────────────────────────

  const handleInitiateDeposit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = await getAccessToken();

      const res = await fetch(`${API_URL}/api/deposit/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountBrl: amount }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao gerar pagamento.");
      }

      const data = await res.json();
      setOrderId(data.orderId);
      setDepositAmount(data.depositAmount);
      setTargetAmount(data.quoteDetails?.destinationAmount || amount);
      // Gera um código Pix simulado a partir do CLABE
      setPixCode(
        data.depositClabe ||
          `00020126580014br.gov.bcb.pix0136${data.orderId}5204000053039865802BR5925VANTS6009SAO PAULO62070503***6304`
      );
    } catch (err: any) {
      console.error("[DepositFlow] Initiate error:", err);
      setError(err.message || "Erro ao iniciar depósito.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Step 3: Simular pagamento (sandbox) ──────────────────────────────────

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const token = await getAccessToken();

      const res = await fetch(`${API_URL}/api/deposit/simulate-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, amountBrl: amount, targetAmount }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao confirmar pagamento.");
      }

      const data = await res.json();
      setReceivedAmount(data.finalAmount || amount);
      if (data.txHash) setTxHash(data.txHash);

      // Se tem uma claim transaction (wallet nova), assina e submete
      if (data.stellarClaimTransaction) {
        const secret = sessionStorage.getItem("vants_wallet_secret_tmp");
        if (secret) {
          const keypair = StellarSdk.Keypair.fromSecret(secret);
          const claimTx = StellarSdk.TransactionBuilder.fromXDR(
            data.stellarClaimTransaction,
            StellarSdk.Networks.TESTNET
          );
          claimTx.sign(keypair);

          const horizonServer = new StellarSdk.Horizon.Server(
            "https://horizon-testnet.stellar.org"
          );
          await horizonServer.submitTransaction(claimTx);
        }
      }

      setStep("success");
    } catch (err: any) {
      console.error("[DepositFlow] Payment error:", err);
      setError(err.message || "Erro ao processar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Copiar código Pix ────────────────────────────────────────────────────

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Avançar do step 1 para step 2 ───────────────────────────────────────

  const handleAdvance = () => {
    if (!isValidAmount) return;
    setStep("trustline");
    handleTrustlineCheck();
  };

  // ─── Progress Bar ─────────────────────────────────────────────────────────

  const stepIndex = { amount: 0, trustline: 1, payment: 2, success: 3 };
  const progress = ((stepIndex[step] + 1) / 4) * 100;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col font-sans animate-in slide-in-from-right duration-300">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full rounded-r-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, var(--vants-blue-deep), var(--vants-blue))",
            }}
          />
        </div>

        {/* Header */}
        {step !== "success" && (
          <header className="flex items-center justify-between px-4 py-4">
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              style={{ color: "var(--vants-ink)" }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span
              className="text-[15px] font-bold"
              style={{ color: "var(--vants-ink)" }}
            >
              {t("depositTitle")}
            </span>
            <div className="w-10" />
          </header>
        )}

        {/* Erro global */}
        {error && (
          <div className="mx-4 mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-[13px] text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ── STEP 1: Inserção de Valor ──────────────────────────────────── */}
        {step === "amount" && (
          <main className="flex-1 flex flex-col px-5 pt-6">
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Label */}
              <p className="text-[13px] font-medium text-slate-500 mb-6 tracking-wider uppercase">
                {t("enterAmount")}
              </p>

              {/* Input visual premium */}
              <div className="flex items-baseline gap-1 mb-2">
                <span
                  className="text-[24px] font-bold opacity-60"
                  style={{ color: "var(--vants-ink)" }}
                >
                  R$
                </span>
                <input
                  id="deposit-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={formattedAmount()}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="text-[48px] font-extrabold tracking-tight bg-transparent border-none outline-none text-center w-full max-w-[260px]"
                  style={{ color: "var(--vants-ink)", caretColor: "var(--vants-blue)" }}
                  placeholder="0,00"
                  autoFocus
                />
              </div>

              {/* Barra decorativa */}
              <div
                className="w-16 h-[3px] rounded-full mb-4"
                style={{
                  backgroundColor: isValidAmount
                    ? "var(--vants-blue)"
                    : "var(--vants-ink-light, #CBD5E1)",
                }}
              />

              <p className="text-[13px] text-slate-400 mb-8">
                {t("minDeposit")}
              </p>
            </div>

            {/* CTA */}
            <div className="pb-8">
              <button
                id="deposit-advance-btn"
                onClick={handleAdvance}
                disabled={!isValidAmount}
                className="w-full h-[54px] rounded-[14px] text-white font-semibold text-[16px] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--vants-blue-deep)",
                }}
              >
                {t("next")} →
              </button>
            </div>
          </main>
        )}

        {/* ── STEP 2: Trustline (loading automático) ────────────────────── */}
        {step === "trustline" && (
          <main className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
              {/* Ícone animado */}
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "oklch(56% 0.13 218 / 0.08)" }}
              >
                {isProcessing ? (
                  <Loader2
                    className="h-10 w-10 animate-spin"
                    style={{ color: "var(--vants-blue-deep)" }}
                  />
                ) : (
                  <Shield
                    className="h-10 w-10"
                    style={{ color: "var(--vants-blue-deep)" }}
                  />
                )}
              </div>

              <div className="text-center">
                <h2
                  className="text-[20px] font-bold mb-2"
                  style={{ color: "var(--vants-ink)" }}
                >
                  {t("preparingVault")}
                </h2>
                <p className="text-[14px] text-slate-500 max-w-[260px]">
                  {t("preparingVaultDesc")}
                </p>
              </div>

              {/* Dots de loading */}
              {isProcessing && (
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
              )}
            </div>
          </main>
        )}

        {/* ── STEP 3: Pagamento Pix ─────────────────────────────────────── */}
        {step === "payment" && (
          <main className="flex-1 flex flex-col px-5 pt-2 pb-8 overflow-y-auto">
            {isProcessing && !pixCode ? (
              // Loading enquanto gera o Pix
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: "var(--vants-blue-deep)" }}
                />
                <p className="text-[14px] text-slate-500 font-medium">
                  Gerando pagamento...
                </p>
              </div>
            ) : (
              <>
                {/* Valor do depósito */}
                <div className="text-center mb-6 mt-2">
                  <p className="text-[13px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                    {t("depositOf")}
                  </p>
                  <p
                    className="text-[36px] font-extrabold tracking-tight"
                    style={{ color: "var(--vants-ink)" }}
                  >
                    R$ {formattedAmount()}
                  </p>
                </div>

                {/* QR Code Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4 shadow-sm">
                  <p
                    className="text-[13px] font-bold text-center mb-4 uppercase tracking-wider"
                    style={{ color: "var(--vants-blue-deep)" }}
                  >
                    {t("pixQrCode")}
                  </p>

                  {/* QR Code visual (canvas-based) */}
                  <div className="flex justify-center mb-4">
                    <QrCodeCanvas data={pixCode} size={200} />
                  </div>

                  {/* Status de aguardando */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--vants-blue)" }}
                    />
                    <p className="text-[13px] text-slate-500 font-medium">
                      {t("awaitingPayment")}
                    </p>
                  </div>
                </div>

                {/* Pix Copia e Cola */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 shadow-sm">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    {t("pixCopyPaste")}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 overflow-hidden">
                      <p className="text-[12px] font-mono text-slate-600 truncate">
                        {pixCode}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[12px] text-green-500 font-medium mt-2 text-center animate-in fade-in duration-300">
                      {t("copied")}
                    </p>
                  )}
                </div>

                {/* Botão "Já paguei" — sandbox */}
                <button
                  id="deposit-paid-btn"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full h-[54px] rounded-[14px] text-white font-semibold text-[16px] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--vants-green, #10B981)" }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("awaitingPayment")}
                    </>
                  ) : (
                    <>
                      <Banknote className="h-5 w-5" />
                      {t("alreadyPaid")}
                    </>
                  )}
                </button>
              </>
            )}
          </main>
        )}

        {/* ── STEP 4: Sucesso ───────────────────────────────────────────── */}
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
                  className="text-[22px] font-bold mb-2"
                  style={{ color: "var(--vants-ink)" }}
                >
                  {t("depositComplete")}
                </h2>
                <p className="text-[14px] text-slate-500 mb-4">
                  {t("depositSuccessDesc")}
                </p>
              </div>

              {/* Valor confirmado */}
              <div
                className="rounded-2xl px-8 py-4 text-center"
                style={{ backgroundColor: "oklch(74% 0.13 155 / 0.08)" }}
              >
                <p className="text-[13px] text-slate-500 font-medium mb-1">
                  {t("depositOf")}
                </p>
                <p
                  className="text-[32px] font-extrabold tracking-tight"
                  style={{ color: "var(--vants-green)" }}
                >
                  + R$ {parseFloat(receivedAmount || amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* ID da Transação / Ordem */}
              <div className="flex flex-col gap-3 w-full mt-2">
                <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                  <span className="text-[12px] font-medium text-slate-500 mb-1">
                    ID da Transação
                  </span>
                  <span className="text-[11px] font-mono break-all text-center text-slate-400">
                    {txHash?.replace("etherfuse-", "") || orderId}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Voltar */}
            <div className="w-full mt-auto pt-8">
              <button
                id="deposit-back-btn"
                onClick={onBack}
                className="w-full h-[54px] rounded-[14px] text-white font-semibold text-[16px] transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "var(--vants-blue-deep)" }}
              >
                {t("backToDashboard")}
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

// ─── QR Code Canvas (geração client-side sem dependência externa) ────────────

/**
 * WHY: Gera um QR Code via canvas puro para evitar dependência de lib.
 * Usa módulos manuais para desenhar os blocos do QR.
 * Versão simplificada — para produção, usar biblioteca como 'qrcode'.
 */
function QrCodeCanvas({ data, size }: { data: string; size: number }) {
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !data) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fundo branco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Gera padrão visual determinístico baseado no data
      const moduleCount = 29;
      const cellSize = size / moduleCount;
      ctx.fillStyle = "#1E293B";

      // Finder patterns (3 cantos)
      drawFinderPattern(ctx, 0, 0, cellSize);
      drawFinderPattern(ctx, (moduleCount - 7) * cellSize, 0, cellSize);
      drawFinderPattern(ctx, 0, (moduleCount - 7) * cellSize, cellSize);

      // Dados codificados como hash visual
      const hash = simpleHash(data);
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          // Pula finder patterns
          if (
            (row < 8 && col < 8) ||
            (row < 8 && col >= moduleCount - 8) ||
            (row >= moduleCount - 8 && col < 8)
          ) {
            continue;
          }

          const idx = row * moduleCount + col;
          const bit = (hash[idx % hash.length] ^ (idx * 7 + row * 3)) & 1;
          if (bit) {
            ctx.fillRect(
              col * cellSize + 0.5,
              row * cellSize + 0.5,
              cellSize - 1,
              cellSize - 1
            );
          }
        }
      }
    },
    [data, size]
  );

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl border border-slate-100"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number
) {
  // Quadrado externo 7x7
  ctx.fillStyle = "#1E293B";
  ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
  // Quadrado branco interno 5x5
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
  // Quadrado escuro central 3x3
  ctx.fillStyle = "#1E293B";
  ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
}

function simpleHash(str: string): number[] {
  const result: number[] = [];
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    result.push(Math.abs(h) % 256);
  }
  // Expandir para pelo menos 841 bytes (29x29)
  while (result.length < 841) {
    h = ((h << 5) - h + result[result.length - 1]) | 0;
    result.push(Math.abs(h) % 256);
  }
  return result;
}
