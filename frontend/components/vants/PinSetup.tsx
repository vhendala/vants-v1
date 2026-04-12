"use client";

/**
 * PinSetup.tsx
 *
 * Componente de configuração do "PIN de Pagamento" da Vants.
 *
 * WHY: Ao usuário, isso é apenas uma medida de segurança — equivalente ao PIN
 * de um banco. Nos bastidores, orquestra a geração do keypair Stellar e
 * criptografia local antes de qualquer chamada ao backend.
 *
 * O backend NUNCA recebe a chave secreta ou o PIN. Apenas o ciphertext.
 */

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Shield, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { generateAccount, encryptSecret } from "@/lib/cryptoService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = "create" | "confirm" | "loading" | "success" | "error";

interface PinSetupProps {
  /** Chamado após setup bem-sucedido com a publicKey do usuário. */
  onComplete: (publicKey: string) => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PIN_LENGTH = 6;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

// ─── Helper: input de um único dígito ─────────────────────────────────────────

interface PinDigitProps {
  value: string;
  focused: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onChange: (value: string) => void;
  onFocus: () => void;
}

function PinDigit({ value, focused, inputRef, onKeyDown, onChange, onFocus }: PinDigitProps) {
  return (
    <input
      ref={inputRef}
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      aria-label="Dígito do PIN"
      className={[
        "w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 outline-none transition-all duration-200",
        "font-mono text-[#081229] bg-white",
        "focus:border-[#6851FF] focus:shadow-[0_0_0_4px_rgba(104,81,255,0.12)]",
        focused
          ? "border-[#6851FF] shadow-[0_0_0_4px_rgba(104,81,255,0.12)]"
          : value
          ? "border-[#6851FF]/40 bg-[#6851FF]/5"
          : "border-slate-200",
      ].join(" ")}
    />
  );
}

// ─── Helper: row de dígitos ───────────────────────────────────────────────────

interface PinInputRowProps {
  digits: string[];
  focusedIndex: number;
  inputRefs: React.RefObject<HTMLInputElement | null>[];
  onDigitChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: (index: number) => void;
}

function PinInputRow({ digits, focusedIndex, inputRefs, onDigitChange, onKeyDown, onFocus }: PinInputRowProps) {
  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, i) => (
        <PinDigit
          key={i}
          value={digit}
          focused={focusedIndex === i}
          inputRef={inputRefs[i]}
          onChange={(v) => onDigitChange(i, v)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={() => onFocus(i)}
        />
      ))}
    </div>
  );
}

// ─── Hook: lógica de PIN input ────────────────────────────────────────────────

function usePinInput() {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = Array.from({ length: PIN_LENGTH }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRef<HTMLInputElement>(null)
  );

  const pin = digits.join("");
  const isFull = pin.length === PIN_LENGTH;

  function handleDigitChange(index: number, value: string) {
    if (!value) return; // deletar via onKeyDown
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (index < PIN_LENGTH - 1) {
      inputRefs[index + 1].current?.focus();
      setFocusedIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setDigits(next);
        inputRefs[index - 1].current?.focus();
        setFocusedIndex(index - 1);
      }
    }
  }

  function reset() {
    setDigits(Array(PIN_LENGTH).fill(""));
    setFocusedIndex(0);
    setTimeout(() => inputRefs[0].current?.focus(), 50);
  }

  return { digits, pin, isFull, focusedIndex, inputRefs, handleDigitChange, handleKeyDown, setFocusedIndex, reset };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PinSetup({ onComplete }: PinSetupProps) {
  const [step, setStep] = useState<Step>("create");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPin, setSavedPin] = useState("");

  const createPin = usePinInput();
  const confirmPin = usePinInput();

  // Foca o primeiro campo ao montar
  useEffect(() => {
    createPin.inputRefs[0].current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateSubmit() {
    if (!createPin.isFull) return;
    setSavedPin(createPin.pin);
    setStep("confirm");
    confirmPin.reset();
  }

  async function handleConfirmSubmit() {
    if (!confirmPin.isFull) return;

    if (confirmPin.pin !== savedPin) {
      setErrorMessage("Os PINs não coincidem. Tente novamente.");
      setStep("error");
      return;
    }

    setStep("loading");

    try {
      // 1. Geração de keypair e criptografia — tudo no cliente
      const account = generateAccount();
      const encryptedSecret = encryptSecret(account.secretKey, savedPin);

      // 2. Envia apenas a publicKey e o blob cifrado ao backend
      const response = await fetch(`${BACKEND_URL}/api/account/secure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookie de sessão Privy
        body: JSON.stringify({
          publicKey: account.publicKey,
          encryptedSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      setStep("success");
      // Aguarda a animação de sucesso antes de notificar o pai
      setTimeout(() => onComplete(account.publicKey), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado.";
      setErrorMessage(message);
      setStep("error");
    }
  }

  function handleRetry() {
    createPin.reset();
    confirmPin.reset();
    setSavedPin("");
    setErrorMessage("");
    setStep("create");
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Card principal */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">

          {/* Header com gradiente Vants */}
          <div className="bg-gradient-to-br from-[#6851FF] to-[#4F46E5] px-6 pt-8 pb-10 text-center relative overflow-hidden">
            {/* Ornamento decorativo */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />

            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner shadow-white/10">
                {step === "loading" ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : step === "success" ? (
                  <CheckCircle className="h-8 w-8 text-white" />
                ) : (
                  <Shield className="h-8 w-8 text-white" />
                )}
              </div>
              <h1 className="text-xl font-bold text-white">
                {step === "confirm" ? "Confirme seu PIN" : step === "success" ? "Conta segura!" : "PIN de Pagamento"}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {step === "confirm"
                  ? "Digite novamente para confirmar"
                  : step === "success"
                  ? "Sua conta está protegida e pronta."
                  : "Crie um PIN de 6 dígitos para proteger sua conta"}
              </p>
            </div>
          </div>

          {/* Corpo */}
          <div className="px-6 py-8">
            {/* Estado: CRIAR PIN */}
            {step === "create" && (
              <div className="flex flex-col gap-6">
                <PinInputRow
                  digits={createPin.digits}
                  focusedIndex={createPin.focusedIndex}
                  inputRefs={createPin.inputRefs}
                  onDigitChange={createPin.handleDigitChange}
                  onKeyDown={createPin.handleKeyDown}
                  onFocus={createPin.setFocusedIndex}
                />
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <Lock className="h-4 w-4 text-[#6851FF] mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Seu PIN é criptografado localmente e nunca é enviado ao nosso servidor.
                  </p>
                </div>
                <button
                  id="vants-pin-create-submit"
                  disabled={!createPin.isFull}
                  onClick={handleCreateSubmit}
                  className="w-full rounded-xl bg-[#6851FF] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#5842e6] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#6851FF]/30"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* Estado: CONFIRMAR PIN */}
            {step === "confirm" && (
              <div className="flex flex-col gap-6">
                <PinInputRow
                  digits={confirmPin.digits}
                  focusedIndex={confirmPin.focusedIndex}
                  inputRefs={confirmPin.inputRefs}
                  onDigitChange={confirmPin.handleDigitChange}
                  onKeyDown={confirmPin.handleKeyDown}
                  onFocus={confirmPin.setFocusedIndex}
                />
                <div className="flex gap-2">
                  <button
                    id="vants-pin-confirm-back"
                    onClick={handleRetry}
                    className="flex-1 rounded-xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Voltar
                  </button>
                  <button
                    id="vants-pin-confirm-submit"
                    disabled={!confirmPin.isFull}
                    onClick={handleConfirmSubmit}
                    className="flex-[2] rounded-xl bg-[#6851FF] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#5842e6] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#6851FF]/30"
                  >
                    Ativar PIN
                  </button>
                </div>
              </div>
            )}

            {/* Estado: LOADING */}
            {step === "loading" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm text-slate-500 text-center">
                  Aplicando proteção à sua conta…
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-[#6851FF] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Estado: SUCESSO */}
            {step === "success" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-sm text-slate-500 text-center">
                  Redirecionando para o seu painel…
                </p>
              </div>
            )}

            {/* Estado: ERRO */}
            {step === "error" && (
              <div className="flex flex-col items-center gap-5 py-2">
                <div className="h-14 w-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#081229]">Algo deu errado</p>
                  <p className="mt-1 text-xs text-slate-500">{errorMessage}</p>
                </div>
                <button
                  id="vants-pin-error-retry"
                  onClick={handleRetry}
                  className="w-full rounded-xl bg-[#6851FF] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#5842e6] active:scale-[0.98] shadow-md shadow-[#6851FF]/30"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de confiança */}
        <p className="mt-4 text-center text-xs text-slate-400">
          🔒 Criptografia de ponta a ponta — seus dados nunca saem do seu dispositivo.
        </p>
      </div>
    </div>
  );
}
