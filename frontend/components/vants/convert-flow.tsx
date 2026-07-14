"use client";

/**
 * convert-flow.tsx
 *
 * Fluxo de swap entre BRL, USD e XLM.
 * 3 passos: Entrada → Processamento → Sucesso
 *
 * WHY: O usuário escolhe a moeda de origem e destino livremente.
 * Por baixo, o backend executa pathPaymentStrictSend na SDEX Stellar.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ArrowDownUp,
  ChevronDown,
} from "lucide-react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { usePrivy } from "@privy-io/react-auth";
import { useLanguage } from "../providers/LanguageProvider";
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils";
import { API_URL } from "../../lib/config";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

// ─── Configuração das moedas ───────────────────────────────────────────────────

type AssetCode = "BRL" | "USD" | "XLM";

interface AssetInfo {
  code: AssetCode;
  label: string;
  symbol: string;
  flag: string;
  decimals: number;
}

const ASSETS: AssetInfo[] = [
  { code: "BRL", label: "Real Brasileiro", symbol: "R$", flag: "🇧🇷", decimals: 2 },
  { code: "USD", label: "Dólar Americano", symbol: "$",  flag: "🇺🇸", decimals: 2 },
  { code: "XLM", label: "Stellar Lumens",  symbol: "XLM", flag: "✦",  decimals: 4 },
];

const assetMap = Object.fromEntries(ASSETS.map((a) => [a.code, a])) as Record<AssetCode, AssetInfo>;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConvertFlowProps {
  publicKey: string;
  onBack: () => void;
}

type Step = "input" | "processing" | "success" | "error";

interface Quote {
  fromAmount: string;
  toAmount: string;
  rate: string;
  minDestinationAmount: string;
}

// ─── Componente seletor de moeda ──────────────────────────────────────────────

function AssetPicker({
  value,
  options,
  onChange,
  label,
}: {
  value: AssetCode;
  options: AssetCode[];
  onChange: (v: AssetCode) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const asset = assetMap[value];

  return (
    <div className="relative">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xl leading-none">{asset.flag}</span>
        <span className="text-[14px] font-bold text-slate-800">{asset.code}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden min-w-[160px]">
          {options.map((code) => {
            const a = assetMap[code];
            return (
              <button
                key={code}
                type="button"
                onClick={() => { onChange(code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${code === value ? "bg-blue-50" : ""}`}
              >
                <span className="text-xl leading-none">{a.flag}</span>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{a.code}</p>
                  <p className="text-[11px] text-slate-400">{a.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConvertFlow({ publicKey, onBack }: ConvertFlowProps) {
  const { t } = useLanguage();
  const { getAccessToken, user } = usePrivy();

  const [step, setStep] = useState<Step>("input");
  const [fromAsset, setFromAsset] = useState<AssetCode>("BRL");
  const [toAsset, setToAsset] = useState<AssetCode>("USD");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ from: string; to: string; fromCode: AssetCode; toCode: AssetCode } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Moedas disponíveis para destino (exclui a de origem)
  const toOptions = ASSETS.map((a) => a.code).filter((c) => c !== fromAsset) as AssetCode[];
  const fromOptions = ASSETS.map((a) => a.code).filter((c) => c !== toAsset) as AssetCode[];

  // Garante que toAsset é válido quando fromAsset muda
  useEffect(() => {
    if (toAsset === fromAsset) {
      const next = ASSETS.find((a) => a.code !== fromAsset);
      if (next) setToAsset(next.code);
    }
  }, [fromAsset]);

  // ─── Inverter par ─────────────────────────────────────────────────────────

  const handleFlip = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setAmount("");
    setQuote(null);
    setQuoteError(null);
  };

  // ─── Busca cotação via SDEX ───────────────────────────────────────────────

  const fetchQuote = useCallback(
    async (amt: string, from: AssetCode, to: AssetCode) => {
      const parsed = parseFloat(amt);
      if (isNaN(parsed) || parsed <= 0) { setQuote(null); setQuoteError(null); return; }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_URL}/api/invest/generic-swap`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          // Usamos amount mínimo para apenas buscar o quote sem construir a tx completa
          body: JSON.stringify({ publicKey, fromAsset: from, toAsset: to, amount: amt }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Falha ao buscar cotação.");

        setQuote({
          fromAmount: data.quote.fromAmount,
          toAmount: data.quote.toAmount,
          rate: data.quote.rate,
          minDestinationAmount: data.quote.minDestinationAmount,
        });
      } catch (err: any) {
        setQuoteError("Sem liquidez disponível para este par. Tente outro valor.");
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    },
    [getAccessToken, publicKey]
  );

  // Dispara debounce ao alterar valor ou par
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); setQuoteError(null); return; }
    debounceRef.current = setTimeout(() => fetchQuote(amount, fromAsset, toAsset), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount, fromAsset, toAsset, fetchQuote]);

  // ─── Executa o swap ───────────────────────────────────────────────────────

  const handleConvert = async () => {
    if (!user?.id || !quote) return;
    setStep("processing");
    setErrorMessage(null);

    try {
      const token = await getAccessToken();

      // 1. Solicita XDR do backend
      const buildRes = await fetch(`${API_URL}/api/invest/generic-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publicKey, fromAsset, toAsset, amount }),
      });

      const buildData = await buildRes.json();
      if (!buildRes.ok || !buildData.success) throw new Error(buildData.error || "Falha ao preparar o swap.");

      // 2. Assina localmente
      const secret = await retrieveDecryptedSecret(user.id);
      if (!secret) throw new Error("Chave de assinatura não encontrada. Faça login novamente.");

      const keypair = StellarSdk.Keypair.fromSecret(secret);
      const transaction = StellarSdk.TransactionBuilder.fromXDR(buildData.xdr, StellarSdk.Networks.TESTNET);
      transaction.sign(keypair);
      const signedXdr = transaction.toXDR();

      // 3. Submete via Horizon
      const server = new StellarSdk.Horizon.Server(HORIZON_URL);
      await server.submitTransaction(transaction as any);

      // 4. Registra no histórico (não-fatal)
      await fetch(`${API_URL}/api/invest/submit-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          signedXdr,
          fromAmount: buildData.quote.fromAmount,
          toAmount: buildData.quote.toAmount,
          userPublicKey: publicKey,
        }),
      }).catch(() => {});

      // 5. Sucesso
      const fromInfo = assetMap[fromAsset];
      const toInfo = assetMap[toAsset];
      const fromFmt = parseFloat(buildData.quote.fromAmount).toLocaleString("pt-BR", { minimumFractionDigits: fromInfo.decimals, maximumFractionDigits: fromInfo.decimals });
      const toFmt = parseFloat(buildData.quote.toAmount).toLocaleString("pt-BR", { minimumFractionDigits: toInfo.decimals, maximumFractionDigits: toInfo.decimals });

      setResultSummary({ from: fromFmt, to: toFmt, fromCode: fromAsset, toCode: toAsset });
      setStep("success");
    } catch (err: any) {
      console.error("[convert-flow] Erro:", err);
      const msg =
        err?.message?.includes("op_too_few_offers") || err?.message?.includes("liquidez")
          ? "Swap indisponível no momento. Tente outro valor ou par."
          : err?.message?.includes("underfunded") || err?.message?.includes("op_underfunded")
          ? "Saldo insuficiente para realizar o swap."
          : err?.message || "Erro inesperado. Tente novamente.";
      setErrorMessage(msg);
      setStep("error");
    }
  };

  const fromInfo = assetMap[fromAsset];
  const toInfo = assetMap[toAsset];
  const canConfirm = parseFloat(amount) > 0 && quote !== null && !isLoadingQuote;

  const toAmountFormatted = quote?.toAmount
    ? parseFloat(quote.toAmount).toLocaleString("pt-BR", { minimumFractionDigits: toInfo.decimals, maximumFractionDigits: toInfo.decimals })
    : null;

  const rateLabel = quote?.rate
    ? `1 ${fromAsset} ≈ ${parseFloat(quote.rate).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${toAsset}`
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans animate-in slide-in-from-right duration-300"
      style={{ backgroundColor: "#F8FAFC" }}
    >
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
            Swap
          </span>
          <div className="w-10" />
        </header>

        {/* ── Step 1: Input ──────────────────────────────────────────────────── */}
        {step === "input" && (
          <main className="flex-1 flex flex-col px-5 py-6 gap-4">

            {/* Card de origem */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <AssetPicker
                  value={fromAsset}
                  options={fromOptions}
                  onChange={setFromAsset}
                  label="Você envia"
                />
              </div>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-slate-300 pointer-events-none">
                  {fromInfo.symbol}
                </span>
                <input
                  id="convert-amount-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 text-[32px] font-bold tabular-nums bg-transparent outline-none border-b-2 border-slate-200 focus:border-[var(--vants-blue-deep)] pb-1 transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-ink)" }}
                />
              </div>
            </div>

            {/* Botão inverter */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleFlip}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: "var(--vants-blue-deep)" }}
              >
                <ArrowDownUp className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Card de destino */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <AssetPicker
                  value={toAsset}
                  options={toOptions}
                  onChange={setToAsset}
                  label="Você recebe"
                />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-slate-300">{toInfo.symbol}</span>
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
                      color: toAmountFormatted ? "var(--vants-ink)" : "#CBD5E1",
                    }}
                  >
                    {toAmountFormatted ?? "0,00"}
                  </span>
                )}
              </div>

              {/* Taxa */}
              {rateLabel && !isLoadingQuote && (
                <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--vants-blue)" }}>
                  <RefreshCw className="h-3 w-3" />
                  <span>{rateLabel}</span>
                </div>
              )}

              {quoteError && (
                <p className="text-[12px] text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {quoteError}
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              id="convert-confirm-btn"
              onClick={handleConvert}
              disabled={!canConfirm}
              className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
              style={{ backgroundColor: "var(--vants-blue-deep)" }}
            >
              Confirmar Swap
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
              <RefreshCw className="h-10 w-10 animate-spin" style={{ color: "var(--vants-blue-deep)" }} />
            </div>
            <div>
              <h2 className="text-[22px] font-black mb-2" style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}>
                Processando Swap...
              </h2>
              <p className="text-[14px] text-slate-500">
                Sua operação está sendo processada com segurança na rede Stellar.
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
              <CheckCircle className="h-10 w-10" style={{ color: "var(--vants-green)" }} />
            </div>

            <div>
              <h2 className="text-[26px] font-black mb-2" style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}>
                Swap Concluído!
              </h2>
              <p className="text-[14px] text-slate-500">Os valores já estão disponíveis na sua conta.</p>
            </div>

            {/* Card de resumo */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Resumo</p>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{assetMap[resultSummary.fromCode].flag}</span>
                  <div className="text-left">
                    <p className="text-[11px] text-slate-400">Você enviou</p>
                    <p className="text-[18px] font-bold tabular-nums" style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-ink)" }}>
                      {assetMap[resultSummary.fromCode].symbol} {resultSummary.from}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--vants-blue-light)" }}>
                  <ArrowDownUp className="h-4 w-4" style={{ color: "var(--vants-blue-deep)" }} />
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Você recebeu</p>
                    <p className="text-[18px] font-bold tabular-nums" style={{ fontFamily: "'Inter', sans-serif", color: "var(--vants-green)" }}>
                      {assetMap[resultSummary.toCode].symbol} {resultSummary.to}
                    </p>
                  </div>
                  <span className="text-xl">{assetMap[resultSummary.toCode].flag}</span>
                </div>
              </div>
            </div>

            <button
              id="convert-back-btn"
              onClick={onBack}
              className="w-full h-[56px] rounded-2xl font-bold text-[16px] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "var(--vants-blue-deep)", color: "#fff" }}
            >
              Voltar ao Início
            </button>
          </div>
        )}

        {/* ── Step: Error ───────────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "oklch(70% 0.18 25 / 0.12)" }}>
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            <div>
              <h2 className="text-[22px] font-black mb-2" style={{ fontFamily: "'Zain', sans-serif", color: "var(--vants-ink)" }}>
                Ops! Algo deu errado.
              </h2>
              <p className="text-[14px] text-slate-500">{errorMessage}</p>
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
