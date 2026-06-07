"use client";

/**
 * convert-flow.tsx
 *
 * WHY: Componente fullstack de conversão de moeda BRL → USD.
 * 3 steps: Entrada de Valor → Processamento → Sucesso.
 *
 * A tecnologia é 100% invisível para o usuário — nenhum jargão cripto.
 * O ativo TESOURO é exibido como "BRL (Real)" e USDC como "USD (Dólar)".
 * O backend constrói a transação e o frontend assina com a chave local.
 *
 * Design System: sincronizado com landing-page-v2.html
 *   - Títulos: Zain 900
 *   - Textos: Manrope
 *   - Números: Inter tabular-nums 700
 *   - Cores: oklch palette (card-bg, green, blue, white, muted)
 *   - Botões: .btn-pill pattern
 *
 * @module convert-flow
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, CheckCircle, ArrowDown } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useLanguage } from "../providers/LanguageProvider";
import { API_URL } from "../../lib/config";
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ConvertStep = "input" | "processing" | "success";

interface ConvertFlowProps {
  publicKey: string;
  onBack: () => void;
}

interface SwapQuoteData {
  rate: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  quoteId: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MIN_CONVERT = 1;
const QUOTE_DEBOUNCE_MS = 600;

// ─── API Frontend ─────────────────────────────────────────────────────────────

/**
 * Solicita cotação de conversão ao backend.
 */
async function fetchSwapQuote(
  amount: string,
  publicKey: string,
  accessToken: string
): Promise<SwapQuoteData> {
  const res = await fetch(`${API_URL}/api/invest/swap-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ publicKey, amount }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      (errData as any).error || "Não foi possível obter a cotação. Tente novamente."
    );
  }

  const data = await res.json();
  return {
    rate: data.rate,
    fromAmount: data.fromAmount,
    toAmount: data.toAmount,
    fee: data.fee,
    quoteId: data.quoteId,
  };
}

/**
 * Solicita ao backend a construção do XDR de swap.
 */
async function fetchSwapXdr(
  amount: string,
  publicKey: string,
  accessToken: string
): Promise<{ xdr: string; quote: SwapQuoteData }> {
  const res = await fetch(`${API_URL}/api/invest/build-swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ publicKey, amount }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      (errData as any).error || "Não foi possível preparar sua conversão. Tente novamente."
    );
  }

  const data = await res.json();
  return { xdr: (data as any).xdr, quote: (data as any).quote };
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConvertFlow({ publicKey, onBack }: ConvertFlowProps) {
  const { t } = useLanguage();
  const { getAccessToken, user } = usePrivy();

  const [step, setStep] = useState<ConvertStep>("input");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<SwapQuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [finalQuote, setFinalQuote] = useState<SwapQuoteData | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Formatação do input BRL ──────────────────────────────────────────────

  const handleAmountChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    const numericValue = parseInt(digits || "0", 10) / 100;
    setAmount(numericValue.toFixed(2));
  };

  const formattedBrl = () => {
    const num = parseFloat(amount || "0");
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const numericAmount = parseFloat(amount || "0");
  const isValidAmount = numericAmount >= MIN_CONVERT;

  // ─── Debounced Quote Fetch ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isValidAmount) {
      setQuote(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoadingQuote(true);
      try {
        const token = await getAccessToken();
        if (!token) return;
        const q = await fetchSwapQuote(amount, publicKey, token);
        setQuote(q);
      } catch (err: any) {
        console.warn("[ConvertFlow] Quote fetch failed:", err.message);
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, isValidAmount, publicKey]);

  // ─── Confirmar Conversão ──────────────────────────────────────────────────

  const handleConfirmConversion = useCallback(async () => {
    setStep("processing");
    setError("");

    try {
      // 1. Token de acesso Privy
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      // 2. Solicitar XDR ao backend
      const { xdr, quote: resultQuote } = await fetchSwapXdr(amount, publicKey, token);
      setFinalQuote(resultQuote);

      // 3. Assinar localmente
      const secret = await retrieveDecryptedSecret(user?.id || "");
      if (!secret) {
        throw new Error(
          "Chave da carteira não encontrada. Faça login novamente."
        );
      }

      const keypair = StellarSdk.Keypair.fromSecret(secret);

      // Verificação de sanidade: a chave derivada deve corresponder à carteira ativa.
      // WHY: O storage pode conter a chave de um e-mail anterior. Se não conferir,
      // a transação seria assinada pela chave errada → tx_bad_auth na Horizon.
      if (keypair.publicKey() !== publicKey) {
        throw new Error(
          "Chave de assinatura não corresponde à carteira ativa. Por favor, saia e faça login novamente."
        );
      }

      const tx = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        StellarSdk.Networks.TESTNET
      );
      tx.sign(keypair);
      const signedXdr = tx.toXDR();

      // 4. Enviar para o backend submeter e registrar (reutiliza o token já obtido no passo 1)
      const submitRes = await fetch(`${API_URL}/api/invest/submit-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signedXdr,
          fromAmount: amount,
          toAmount: resultQuote?.toAmount || quote?.toAmount || "0.00",
          userPublicKey: publicKey,
        }),
      });

      if (!submitRes.ok) {
        const errorData = await submitRes.json();
        throw new Error(errorData.error || "Falha ao submeter a conversão no servidor.");
      }

      // 5. Sucesso!
      setStep("success");
    } catch (err: any) {
      console.error("[ConvertFlow] Erro ao processar conversão:", err);
      if (err.response && err.response.data && err.response.data.extras) {
        console.error("[ConvertFlow] Horizon error details:", err.response.data.extras.result_codes);
      }

      let friendlyMessage = "Ocorreu um erro ao processar sua conversão. Tente novamente.";
      if (err.message?.includes("Sessão") || err.message?.includes("Chave")) {
        friendlyMessage = err.message;
      } else if (err.message?.includes("op_underfunded") || err.message?.includes("tx_failed")) {
        friendlyMessage = "Saldo insuficiente para esta conversão.";
      } else if (err.message?.includes("op_no_destination") || err.message?.includes("op_too_few_offers")) {
        friendlyMessage = "Conversão temporariamente indisponível. Tente novamente em alguns minutos.";
      } else if (err.message?.includes("Network")) {
        friendlyMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      }
      setError(friendlyMessage);
      setStep("input");
    }
  }, [getAccessToken, amount, publicKey, user]);

  // ─── Progress Bar ─────────────────────────────────────────────────────────

  const stepIndex = { input: 0, processing: 1, success: 2 };
  const progress = ((stepIndex[step] + 1) / 3) * 100;

  // Valor de destino formatado
  const destAmount = quote
    ? parseFloat(quote.toAmount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const finalFromFormatted = finalQuote
    ? parseFloat(finalQuote.fromAmount).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : formattedBrl();

  const finalToFormatted = finalQuote
    ? parseFloat(finalQuote.toAmount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : destAmount;

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
        {step === "input" && (
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
              style={{
                fontFamily: "'Manrope', sans-serif",
                color: "var(--vants-ink)",
              }}
            >
              {t("convertTitle")}
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
            STEP 1: Entrada de Valor (Câmbio)
           ════════════════════════════════════════════════════════════════ */}
        {step === "input" && (
          <main className="flex-1 flex flex-col px-5 pt-4">
            <div className="flex-1 flex flex-col items-center justify-center">

              {/* ── Card: Origem (BRL) ─────────────────────────────────── */}
              <div
                className="w-full rounded-2xl p-5 mb-3"
                style={{
                  backgroundColor: "oklch(98% 0 0)",
                  border: "1px solid oklch(92% 0 0)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] font-bold tracking-[0.2em] uppercase"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      color: "var(--vants-muted)",
                    }}
                  >
                    {t("convertFrom")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">🇧🇷</span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: "var(--vants-ink)",
                      }}
                    >
                      {t("brlReal")}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[20px] font-bold opacity-50"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: "var(--vants-ink)",
                    }}
                  >
                    R$
                  </span>
                  <input
                    id="convert-amount-input"
                    type="text"
                    inputMode="numeric"
                    value={formattedBrl()}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-right w-full"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "36px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--vants-ink)",
                      caretColor: "var(--vants-blue)",
                    }}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>

              {/* ── Ícone de Seta (Separador) ─────────────────────────── */}
              <div
                className="flex items-center justify-center h-10 w-10 rounded-full -my-2 z-10"
                style={{
                  backgroundColor: "var(--vants-blue-deep)",
                  boxShadow: "0 4px 12px oklch(30% 0.12 218 / 0.3)",
                }}
              >
                <ArrowDown className="h-5 w-5 text-white" />
              </div>

              {/* ── Card: Destino (USD) ────────────────────────────────── */}
              <div
                className="w-full rounded-2xl p-5 mt-3"
                style={{
                  backgroundColor: "oklch(98% 0 0)",
                  border: "1px solid oklch(92% 0 0)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] font-bold tracking-[0.2em] uppercase"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      color: "var(--vants-muted)",
                    }}
                  >
                    {t("convertTo")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">🇺🇸</span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: "var(--vants-ink)",
                      }}
                    >
                      {t("usdDollar")}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[20px] font-bold opacity-50"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: "var(--vants-ink)",
                    }}
                  >
                    $
                  </span>
                  <p
                    className="text-right w-full"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "36px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: isValidAmount
                        ? "var(--vants-green)"
                        : "var(--vants-muted)",
                    }}
                  >
                    {isLoadingQuote ? "..." : destAmount}
                  </p>
                </div>
              </div>

              {/* ── Taxa de câmbio ─────────────────────────────────────── */}
              {isValidAmount && quote && (
                <div
                  className="flex items-center gap-2 mt-5 animate-in fade-in duration-300"
                >
                  <p
                    className="text-[13px] font-medium"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      color: "var(--vants-muted)",
                    }}
                  >
                    {t("exchangeRate")}:
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--vants-blue)",
                    }}
                  >
                    1 USD = {(1 / parseFloat(quote.rate)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BRL
                  </p>
                </div>
              )}

              {/* ── Mínimo ────────────────────────────────────────────── */}
              <p
                className="text-[13px] mt-3 mb-6"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  color: "var(--vants-muted)",
                }}
              >
                {t("minConversion")}
              </p>
            </div>

            {/* CTA */}
            <div className="pb-8">
              <button
                id="convert-confirm-btn"
                onClick={handleConfirmConversion}
                disabled={!isValidAmount || isLoadingQuote}
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
                {t("confirmConversion")} →
              </button>
            </div>
          </main>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: Processamento
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
                  {t("converting")}
                </h2>
                <p
                  className="text-[14px] max-w-[260px]"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  {t("convertingDesc")}
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
            STEP 3: Sucesso
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
                  {t("conversionComplete")}
                </h2>
                <p
                  className="text-[14px] max-w-[280px]"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    color: "var(--vants-muted)",
                  }}
                >
                  {t("conversionCompleteDesc")}
                </p>
              </div>

              {/* Card de resumo */}
              <div
                className="rounded-2xl p-6 w-full max-w-[320px]"
                style={{
                  backgroundColor: "oklch(98% 0 0)",
                  border: "1px solid oklch(92% 0 0)",
                }}
              >
                <p
                  className="text-[11px] font-bold tracking-[0.25em] uppercase mb-5 text-center"
                  style={{ color: "var(--vants-muted)" }}
                >
                  {t("conversionSummary")}
                </p>

                {/* De */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">🇧🇷</span>
                    <span
                      className="text-[13px] font-medium"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: "var(--vants-muted)",
                      }}
                    >
                      {t("youConverted")}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--vants-ink)",
                    }}
                  >
                    R$ {finalFromFormatted}
                  </span>
                </div>

                {/* Separador */}
                <div
                  className="h-px w-full mb-4"
                  style={{ backgroundColor: "oklch(92% 0 0)" }}
                />

                {/* Para */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">🇺🇸</span>
                    <span
                      className="text-[13px] font-medium"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: "var(--vants-muted)",
                      }}
                    >
                      {t("youReceived")}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--vants-green)",
                    }}
                  >
                    + $ {finalToFormatted}
                  </span>
                </div>
              </div>

              {/* Taxa utilizada */}
              {finalQuote && (
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-xl w-full max-w-[320px]"
                  style={{
                    backgroundColor: "oklch(56% 0.13 218 / 0.06)",
                    border: "1px solid oklch(56% 0.13 218 / 0.1)",
                  }}
                >
                  <ArrowDown
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--vants-blue)" }}
                  />
                  <div>
                    <p
                      className="text-[12px] font-medium"
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        color: "var(--vants-muted)",
                      }}
                    >
                      {t("exchangeRate")}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--vants-blue)",
                      }}
                    >
                      1 USD = {(1 / parseFloat(finalQuote.rate)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BRL
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Voltar */}
            <div className="w-full mt-auto pt-8">
              <button
                id="convert-back-btn"
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
                {t("backToDashboard")}
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
