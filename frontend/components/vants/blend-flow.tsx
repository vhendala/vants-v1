"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  HandCoins,
  Landmark,
  ExternalLink,
} from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import * as StellarSdk from "@stellar/stellar-sdk"
import { API_URL } from "../../lib/config"
import { retrieveDecryptedSecret } from "../../lib/cryptoUtils"

/**
 * blend-flow.tsx — UI do "Borrow & Pay" Orchestrator (Blend / Soroban, Testnet).
 *
 * WHY: O usuário deposita seu ativo (XLM) como colateral no Blend e saca quando
 * quiser; e pode tomar USDC emprestado contra esse colateral e pagar de volta.
 *
 * Fluxo não-custodial: o backend monta+simula a transação Soroban (/api/blend/build),
 * aqui assinamos com a chave local e submetemos via RPC Soroban; depois registramos
 * o txHash no histórico (/api/blend/record). Espelha o padrão do withdraw-flow.
 */

const SOROBAN_RPC = "https://soroban-testnet.stellar.org"
const HORIZON_URL = "https://horizon-testnet.stellar.org"
const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/"

// Os ativos não-nativos do Blend são SACs clássicos: para recebê-los (borrow) é
// preciso ter uma trustline clássica. Emissores na Testnet:
const ASSET_ISSUERS: Record<string, string> = {
  USDC: "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56",
}

/**
 * Garante que a carteira tenha trustline clássica para um ativo SAC (ex: USDC).
 * Idempotente: se já existir, não faz nada. Necessário antes de borrow/repay.
 */
async function ensureTrustline(
  keypair: StellarSdk.Keypair,
  symbol: string,
  setMsg: (s: string) => void
): Promise<void> {
  const issuer = ASSET_ISSUERS[symbol]
  if (!issuer) return // ativo nativo (XLM) não precisa de trustline

  const horizon = new StellarSdk.Horizon.Server(HORIZON_URL)
  const account = await horizon.loadAccount(keypair.publicKey())
  const hasLine = account.balances.some(
    (b: any) => b.asset_code === symbol && b.asset_issuer === issuer
  )
  if (hasLine) return

  setMsg("Autorizando ativo na carteira...")
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: new StellarSdk.Asset(symbol, issuer) }))
    .setTimeout(60)
    .build()
  tx.sign(keypair)
  await horizon.submitTransaction(tx)
  await new Promise((r) => setTimeout(r, 3000)) // aguarda indexação do ledger
}

type BlendAction = "supply" | "withdraw" | "borrow" | "repay"

interface ActionMeta {
  id: BlendAction
  label: string
  asset: string
  title: string
  subtitle: string
  cta: string
  icon: React.ElementType
  recordType: string
  recordDesc: string
}

// supply/withdraw operam sobre XLM (colateral); borrow/repay sobre USDC (dívida).
const ACTIONS: ActionMeta[] = [
  {
    id: "supply",
    label: "Depositar",
    asset: "XLM",
    title: "Depositar colateral",
    subtitle: "Deposite XLM no Blend como garantia. Rende juros e libera empréstimos.",
    cta: "Confirmar depósito",
    icon: ArrowDownToLine,
    recordType: "BLEND_SUPPLY",
    recordDesc: "Depósito de colateral no Blend",
  },
  {
    id: "withdraw",
    label: "Sacar",
    asset: "XLM",
    title: "Sacar colateral",
    subtitle: "Retire o XLM que você depositou no Blend a qualquer momento.",
    cta: "Confirmar saque",
    icon: ArrowUpFromLine,
    recordType: "BLEND_WITHDRAW",
    recordDesc: "Saque de colateral do Blend",
  },
  {
    id: "borrow",
    label: "Emprestar",
    asset: "USDC",
    title: "Tomar emprestado",
    subtitle: "Pegue USDC emprestado usando seu XLM como garantia.",
    cta: "Confirmar empréstimo",
    icon: HandCoins,
    recordType: "BLEND_BORROW",
    recordDesc: "Empréstimo de USDC no Blend",
  },
  {
    id: "repay",
    label: "Pagar",
    asset: "USDC",
    title: "Pagar dívida",
    subtitle: "Quite o USDC que você tomou emprestado no Blend.",
    cta: "Confirmar pagamento",
    icon: Landmark,
    recordType: "BLEND_REPAY",
    recordDesc: "Pagamento de dívida no Blend",
  },
]

interface BlendPosition {
  collateral: number
  supply: number
  liabilities: number
}

interface BlendReserve {
  symbol: string
  supplyApy: number
  borrowApy: number
  available: number
}

interface BlendFlowProps {
  onBack: () => void
  publicKey?: string
}

export function BlendFlow({ onBack, publicKey }: BlendFlowProps) {
  const { getAccessToken, user } = usePrivy()

  const [actionId, setActionId] = useState<BlendAction>("supply")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "loading" | "success" | "error">("input")
  const [loadingMessage, setLoadingMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [txHash, setTxHash] = useState("")

  const [positions, setPositions] = useState<Record<string, BlendPosition> | null>(null)
  const [reserves, setReserves] = useState<BlendReserve[]>([])

  const action = ACTIONS.find((a) => a.id === actionId)!

  const loadPoolInfo = useCallback(async () => {
    if (!publicKey) return
    try {
      const res = await fetch(`${API_URL}/api/blend/pool-info?publicKey=${publicKey}`)
      const data = await res.json()
      if (data.success) {
        setPositions(data.positions || {})
        setReserves(data.reserves || [])
      }
    } catch (err) {
      console.error("[BlendFlow] Falha ao carregar pool-info:", err)
    }
  }, [publicKey])

  useEffect(() => {
    loadPoolInfo()
  }, [loadPoolInfo])

  const suppliedXlm = (positions?.XLM?.collateral || 0) + (positions?.XLM?.supply || 0)
  const borrowedUsdc = positions?.USDC?.liabilities || 0
  const reserve = reserves.find((r) => r.symbol === action.asset)

  async function handleSubmit() {
    if (!amount || !publicKey) return

    setStep("loading")
    setErrorMessage("")

    try {
      setLoadingMessage("Validando sessão...")
      const token = await getAccessToken()
      if (!token) throw new Error("Sessão inválida. Autentique novamente.")

      const secret = await retrieveDecryptedSecret(user?.id || "")
      if (!secret) {
        throw new Error("Chave de assinatura não encontrada no dispositivo. Autentique novamente.")
      }
      const keypair = StellarSdk.Keypair.fromSecret(secret)

      // 0. Para ativos SAC (ex: USDC no borrow/repay), garante a trustline clássica.
      await ensureTrustline(keypair, action.asset, setLoadingMessage)

      // 1. Backend monta e simula a transação Soroban (footprint + fees embutidos)
      setLoadingMessage("Montando transação Soroban...")
      const buildRes = await fetch(`${API_URL}/api/blend/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          publicKey: keypair.publicKey(),
          action: actionId,
          asset: action.asset,
          amount: Number(amount).toString(),
        }),
      })
      if (!buildRes.ok) {
        const e = await buildRes.json().catch(() => ({}))
        throw new Error(e.error || "Falha ao montar a transação.")
      }
      const { xdr } = await buildRes.json()

      // 2. Assina localmente e submete via RPC Soroban
      setLoadingMessage("Assinando e enviando...")
      const server = new StellarSdk.rpc.Server(SOROBAN_RPC)
      const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, StellarSdk.Networks.TESTNET)
      tx.sign(keypair)

      const sendRes = await server.sendTransaction(tx as StellarSdk.Transaction)
      if ((sendRes.status as string) === "ERROR") {
        console.error("[BlendFlow] sendTransaction ERROR:", sendRes.errorResult)
        throw new Error("A rede rejeitou a transação. Verifique saldo, colateral ou liquidez.")
      }

      // 3. Aguarda a confirmação on-chain
      setLoadingMessage("Confirmando na rede...")
      let getRes = await server.getTransaction(sendRes.hash)
      let tries = 0
      while ((getRes.status as string) === "NOT_FOUND" && tries < 30) {
        await new Promise((r) => setTimeout(r, 1000))
        getRes = await server.getTransaction(sendRes.hash)
        tries++
      }
      if ((getRes.status as string) !== "SUCCESS") {
        throw new Error(
          "Transação não confirmada. " +
            ((getRes.status as string) === "FAILED"
              ? "A operação falhou on-chain (cheque colateral/saldo)."
              : "Tempo de confirmação excedido.")
        )
      }

      setTxHash(sendRes.hash)

      // 4. Registra no histórico (não bloqueante)
      fetch(`${API_URL}/api/blend/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          txHash: sendRes.hash,
          type: action.recordType,
          amount: Number(amount).toString(),
          asset: action.asset,
          description: `${action.recordDesc} (${amount} ${action.asset})`,
        }),
      }).catch(() => {})

      setStep("success")
    } catch (err: any) {
      console.error("[BlendFlow] Erro:", err)
      setErrorMessage(err.message || "Ocorreu um erro desconhecido.")
      setStep("error")
    }
  }

  // ─── Tela de sucesso ─────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div
        className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans animate-fade-in"
        style={{ color: "var(--vants-ink)" }}
      >
        <div className="mx-auto max-w-md w-full flex-1 flex flex-col pt-12 pb-8">
          <main className="flex-1 flex flex-col items-center pt-8 px-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full mb-8" style={{ backgroundColor: "#E6F8ED" }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#10B981" }}>
                <Check className="h-8 w-8 text-white" strokeWidth={4} />
              </div>
            </div>

            <h1 className="text-[28px] font-bold mb-4" style={{ color: "var(--vants-ink)" }}>
              {action.label} concluído
            </h1>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] font-bold leading-none" style={{ color: "var(--vants-ink)" }}>
                {Number(amount).toLocaleString("pt-BR", { maximumFractionDigits: 7 })}
              </span>
              <span className="text-[20px] font-bold text-slate-400">{action.asset}</span>
            </div>
            <p className="text-[15px] font-medium text-slate-500 mb-8">{action.title} · Blend</p>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-slate-200 bg-white w-full">
                <span className="text-[12px] font-medium text-slate-500 mb-1">ID da Transação (Soroban)</span>
                <span className="text-[11px] font-mono break-all text-center text-slate-400">{txHash}</span>
              </div>
              <a
                href={`${EXPLORER_TX}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white w-full text-[13px] font-bold"
                style={{ color: "var(--vants-blue)" }}
              >
                Ver no Stellar Expert <ExternalLink className="h-4 w-4" />
              </a>
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

  // ─── Tela principal ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-10 animate-fade-in"
      style={{ color: "var(--vants-ink)" }}
    >
      <div className="mx-auto max-w-md w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 mb-2">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            style={{ color: "var(--vants-ink)" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--vants-ink)" }}>
            <img src="/blend-logo.svg" alt="Blend" className="h-5 w-5" />
            Blend · Empréstimos
          </span>
          <div className="w-10" />
        </header>

        <main className="px-5 flex flex-col gap-5 mt-2">
          {/* Seletor de ação */}
          <div className="grid grid-cols-4 gap-2">
            {ACTIONS.map((a) => {
              const ActiveIcon = a.icon
              const isActive = a.id === actionId
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setActionId(a.id)
                    setAmount("")
                    setStep("input")
                    setErrorMessage("")
                  }}
                  disabled={step === "loading"}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all"
                  style={{
                    borderColor: isActive ? "var(--vants-blue)" : "#E2E8F0",
                    backgroundColor: isActive ? "var(--vants-blue)" : "white",
                    color: isActive ? "white" : "#64748B",
                  }}
                >
                  <ActiveIcon className="h-5 w-5" />
                  <span className="text-[11px] font-bold">{a.label}</span>
                </button>
              )
            })}
          </div>

          {/* Resumo de posição */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium text-slate-500 mb-1">Colateral (XLM)</p>
              <p className="text-[18px] font-bold text-slate-900">
                {suppliedXlm.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium text-slate-500 mb-1">Dívida (USDC)</p>
              <p className="text-[18px] font-bold text-slate-900">
                {borrowedUsdc.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
              </p>
            </div>
          </div>

          {/* Título da ação */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: "oklch(60% 0.13 250 / 0.10)" }}
            >
              <action.icon className="h-5 w-5" style={{ color: "var(--vants-blue)" }} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: "var(--vants-ink)" }}>
                {action.title}
              </h2>
              <p className="text-[12px] text-slate-500 leading-snug">{action.subtitle}</p>
            </div>
          </div>

          {step === "error" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Erro na transação</p>
                <p className="text-xs text-red-600 mt-1 break-words">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Input de valor */}
          <div>
            <div className="flex items-center justify-between mb-2 pl-1">
              <label className="text-[13px] font-bold" style={{ color: "var(--vants-ink)" }}>
                Valor ({action.asset})
              </label>
              {reserve && (
                <span className="text-[11px] text-slate-500">
                  {actionId === "borrow"
                    ? `${reserve.available.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} disponível`
                    : `${(actionId === "supply" ? reserve.supplyApy : reserve.borrowApy).toFixed(2)}% APY`}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.0000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={step === "loading"}
                className="w-full h-[56px] rounded-2xl border border-slate-200 bg-white pl-4 pr-20 text-[18px] font-bold transition-all outline-none focus:border-[var(--vants-blue)]"
                style={{ color: "var(--vants-ink)" }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {action.asset}
              </span>
            </div>
          </div>
        </main>

        <div className="px-5 mt-8">
          <button
            onClick={handleSubmit}
            disabled={step === "loading" || !amount || Number(amount) <= 0}
            className="flex w-full h-[60px] items-center justify-center gap-2 rounded-full text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--vants-blue-deep)" }}
          >
            {step === "loading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-bold text-[16px]">{loadingMessage || "Processando..."}</span>
              </>
            ) : (
              <span className="font-bold text-[16px]">{action.cta}</span>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-3">
            Powered by Blend · Soroban Testnet
          </p>
        </div>
      </div>
    </div>
  )
}
