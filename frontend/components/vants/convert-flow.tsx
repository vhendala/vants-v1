"use client";

/**
 * convert-flow.tsx
 *
 * Fluxo de conversão manual de BRL → USD.
 * 3 passos: Entrada → Processamento → Sucesso
 *
 * WHY: Sem jargão Web3. O usuário só vê BRL/Real e USD/Dólar.
 * Por baixo, o backend executa um swap TESOURO → USDC via SDEX.
 * O frontend assina o XDR localmente com a chave armazenada criptografada.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { usePrivy } from "@privy-io/react-auth";
import { useLanguage } from "../providers/LanguageProvider";
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils";
import { API_URL } from "../../lib/config";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

interface ConvertFlowProps {
  publicKey: string;
  onBack: () => void;
}

type Step = "input" | "processing" | "success" | "error";

interface Quote {
  rate: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
}

export function ConvertFlow({ publicKey, onBack }: ConvertFlowProps) {
  const { t } = useLanguage();
  const { getAccessToken, user } = usePrivy();

  const [step, setStep] = useState<Step>("input");
  const [brlAmount, setBrlAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ brl: string; usd: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Busca cotação com debounce de 500ms ──────────────────────────────────
  const fetchQuote = useCallback(
    async (amount: string) => {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed < 1) {
        setQuote(null);
        setQuoteError(null);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_URL}/api/invest/swap-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ publicKey, amount }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Falha ao buscar cotação.");
        }

        setQuote({
          rate: data.rate,
          fromAmount: data.fromAmount,
          toAmount: data.toAmount,
          fee: data.fee,
        });
      } catch (err: any) {
        setQuoteError("Não foi possível obter a cotação. Tente novamente.");
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [getAccessToken, publicKey]
  );

  // Dispara debounce ao alterar valor
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!brlAmount || parseFloat(brlAmount) < 1) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchQuote(brlAmount);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [brlAmount, fetchQuote]);

  // ─── Executa a conversão ───────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!user?.id) return;

    const parsed = parseFloat(brlAmount);
    if (isNaN(parsed) || parsed < 1) return;

    setStep("processing");
    setErrorMessage(null);

    try {
      const token = await getAccessToken();

      // 1. Solicita o XDR do backend
      const buildRes = await fetch(`${API_URL}/api/invest/build-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicKey, amount: brlAmount }),
      });

      const buildData = await buildRes.json();
      if (!buildRes.ok || !buildData.success) {
        throw new Error(buildData.error || "Falha ao preparar a conversão.");
      }

      const { xdr, quote: buildQuote } = buildData;

      // 2. Recupera secret criptografada do localStorage
      const secret = await retrieveDecryptedSecret(user.id);
      if (!secret) {
        throw new Error("Chave de assinatura não encontrada. Faça login novamente.");
      }

      // 3. Assina o XDR localmente
      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        StellarSdk.Networks.TESTNET
      );
      transaction.sign(keypair);
      const signedXdr = transaction.toXDR();

      // 4. Submete via Horizon
      const server = new StellarSdk.Horizon.Server(HORIZON_URL);
      await server.submitTransaction(transaction as any);

      // 5. Registra no histórico via backend
      await fetch(`${API_URL}/api/invest/submit-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signedXdr,
          fromAmount: buildQuote?.fromAmount || brlAmount,
          toAmount: buildQuote?.toAmount || "0",
          userPublicKey: publicKey,
        }),
      }).catch(() => {
        // Falha no registro é não-fatal — a transação já foi submetida com sucesso
      });

      // 6. Sucesso
      const usdReceived = buildQuote?.toAmount
        ? parseFloat(buildQuote.toAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "—";
      const brlSent = parseFloat(brlAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      setResultSummary({ brl: brlSent, usd: usdReceived });
      setStep("success");
    } catch (err: any) {
      console.error("[convert-flow] Erro na conversão:", err);
      const msg =
        err?.message?.includes("op_too_few_offers") || err?.message?.includes("liquidez")
          ? "Conversão indisponível no momento. Tente novamente em alguns minutos."
          : err?.message?.includes("underfunded") || err?.message?.includes("op_underfunded")
          ? "Saldo insuficiente para realizar a conversão."
          : err?.message || "Erro inesperado. Tente novamente.";
      setErrorMessage(msg);
      setStep("error");
    }
  };

  // ─── Taxa invertida para exibição ao usuário ───────────────────────────────
  const invertedRate = quote?.rate && parseFloat(quote.rate) > 0
    ? (1 / parseFloat(quote.rate)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const usdPreview = quote?.toAmount
    ? parseFloat(quote.toAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  const isValidAmount = parseFloat(brlAmount) >= 1;
  const canConfirm = isValidAmount && quote !== null && !isLoadingQuote;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col font-sans animate-in slide-in-from-right duration-300" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            style={{ color: "var(--vants-ink)" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span
            className="text-[16px] font-bold"
            style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}
          >
            {t("convertTitle") || "Converter"}
          </span>
          <div className="w-10" />
        </header>

        {/* ── Step 1: Input ─────────────────────────────────────────────────── */}
        {step === "input" && (
          <main className="flex-1 flex flex-col px-5 py-6 gap-5">
            {/* Card de origem */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🇧🇷</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {t("convertFrom") || "Você envia (BRL)"}
                  </p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[20px] font-semibold text-slate-400 mr-1">
                  R$
                </span>
                <input
                  id="convert-brl-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  min="1"
                  step="0.01"
                  value={brlAmount}
                  onChange={(e) => setBrlAmount(e.target.value)}
                  className="w-full pl-10 text-[32px] font-bold tabular-nums bg-transparent outline-none border-b-2 border-slate-200 focus:border-[var(--vants-blue-deep)] pb-1 transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-ink)" }}
                />
              </div>
              <p className="text-[12px] text-slate-400 mt-2">{t("convertMinAmount") || "Mínimo R$ 1,00"}</p>
            </div>

            {/* Seta de conversão */}
            <div className="flex items-center justify-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--vants-blue-deep)" }}
              >
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Card de destino */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🇺🇸</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {t("convertTo") || "Você recebe (USD)"}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-semibold text-slate-300">$</span>
                {isLoadingQuote ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
                    <span className="text-slate-400 text-base">Calculando...</span>
                  </div>
                ) : (
                  <span
                    className="text-[32px] font-bold tabular-nums"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: usdPreview ? "var(--vants-ink)" : "#CBD5E1",
                    }}
                  >
                    {usdPreview ?? "0,00"}
                  </span>
                )}
              </div>

              {/* Taxa de câmbio */}
              {invertedRate && !isLoadingQuote && (
                <div
                  className="mt-3 flex items-center gap-1.5 text-[12px] font-medium"
                  style={{ color: "var(--vants-blue)" }}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    {t("convertRate") || "Taxa"}: 1 USD = {invertedRate} BRL
                  </span>
                </div>
              )}

              {quoteError && (
                <p className="text-[12px] text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {quoteError}
                </p>
              )}
            </div>

            {/* Botão confirmar */}
            <button
              id="convert-confirm-btn"
              onClick={handleConvert}
              disabled={!canConfirm}
              className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
              style={{ backgroundColor: "var(--vants-blue-deep)" }}
            >
              {t("convertConfirm") || "Confirmar Conversão"}
            </button>
          </main>
        )}

        {/* ── Step 2: Processing ────────────────────────────────────────────── */}
        {step === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: "var(--vants-blue-light)" }}
            >
              <RefreshCw
                className="h-10 w-10 animate-spin"
                style={{ color: "var(--vants-blue-deep)" }}
              />
            </div>
            <div>
              <h2
                className="text-[22px] font-black mb-2"
                style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}
              >
                {t("converting") || "Convertendo moedas..."}
              </h2>
              <p className="text-[14px] text-slate-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Sua operação está sendo processada com segurança.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ───────────────────────────────────────────────── */}
        {step === "success" && resultSummary && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "oklch(74% 0.13 155 / 0.12)" }}
            >
              <CheckCircle
                className="h-10 w-10"
                style={{ color: "var(--vants-green)" }}
              />
            </div>

            <div>
              <h2
                className="text-[26px] font-black mb-2"
                style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}
              >
                {t("convertSuccess") || "Conversão Concluída!"}
              </h2>
              <p className="text-[14px] text-slate-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Os valores já estão disponíveis na sua conta.
              </p>
            </div>

            {/* Card de resumo */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {t("convertSummary") || "Resumo"}
                </p>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇧🇷</span>
                  <div className="text-left">
                    <p className="text-[11px] text-slate-400">Você enviou</p>
                    <p
                      className="text-[18px] font-bold tabular-nums"
                      style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-ink)" }}
                    >
                      R$ {resultSummary.brl}
                    </p>
                  </div>
                </div>

                <div
                  className="h-8 w-8 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--vants-blue-light)" }}
                >
                  <TrendingDown className="h-4 w-4" style={{ color: "var(--vants-blue-deep)" }} />
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Você recebeu</p>
                    <p
                      className="text-[18px] font-bold tabular-nums"
                      style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-green)" }}
                    >
                      $ {resultSummary.usd}
                    </p>
                  </div>
                  <span className="text-xl">🇺🇸</span>
                </div>
              </div>
            </div>

            <button
              id="convert-back-btn"
              onClick={onBack}
              className="w-full h-[56px] rounded-2xl font-bold text-[16px] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "var(--vants-blue-deep)", color: "#fff" }}
            >
              {t("convertBack") || "Voltar ao Início"}
            </button>
          </div>
        )}

        {/* ── Step: Error ───────────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "oklch(70% 0.18 25 / 0.12)" }}
            >
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            <div>
              <h2
                className="text-[22px] font-black mb-2"
                style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}
              >
                Ops! Algo deu errado.
              </h2>
              <p className="text-[14px] text-slate-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {errorMessage}
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep("input")}
                className="flex-1 h-[52px] rounded-2xl font-bold text-[15px] border border-slate-200 bg-white transition-all hover:bg-slate-50"
                style={{ color: "var(--vants-ink)" }}
              >
                Tentar Novamente
              </button>
              <button
                onClick={onBack}
                className="flex-1 h-[52px] rounded-2xl font-bold text-[15px] text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--vants-blue-deep)" }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
