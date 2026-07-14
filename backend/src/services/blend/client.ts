/**
 * blend/client.ts — Cliente server-side do Blend (Soroban Lending, Testnet).
 *
 * WHY: É o "Borrow & Pay" Orchestrator. O backend monta e **simula** a transação
 * Soroban (footprint + resource fees embutidos) e devolve o XDR pronto. O
 * frontend apenas assina com a chave local do usuário (não-custodial) e submete
 * via RPC Soroban — mesmo padrão usado na integração Defindex.
 *
 * Fluxo de uma ação:
 *   PoolContractV2.submit({ from, spender, to, requests }) → op XDR base64
 *   → TransactionBuilder(source = usuário) → rpc.prepareTransaction (simula+monta)
 *   → XDR assemblado devolvido ao frontend
 *
 * @module blend/client
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { PoolContractV2, PoolV2, RequestType } from "@blend-capital/blend-sdk";
import {
  BLEND_NETWORK,
  BLEND_POOL_ADDRESS,
  BLEND_ASSETS,
  BLEND_SYMBOL_BY_ADDRESS,
  BLEND_DECIMALS,
  type BlendAction,
} from "./config";

// ─── Mapeamento ação → RequestType do Blend ────────────────────────────────────
//
// supply/withdraw usam *Collateral* para que o ativo conte como garantia e
// habilite o borrow (a feature "Borrow & Pay"). borrow/repay são diretos.
const ACTION_TO_REQUEST: Record<BlendAction, RequestType> = {
  supply: RequestType.SupplyCollateral,
  withdraw: RequestType.WithdrawCollateral,
  borrow: RequestType.Borrow,
  repay: RequestType.Repay,
};

const SCALE = 10 ** BLEND_DECIMALS;

// ─── Construção da transação ───────────────────────────────────────────────────

/**
 * Constrói e simula uma transação Blend, devolvendo o XDR assemblado (base64)
 * **não-assinado**, pronto para o frontend assinar e submeter.
 *
 * @param userPublicKey Chave pública Stellar (G...) do usuário — é from/spender/to.
 * @param action        "supply" | "withdraw" | "borrow" | "repay".
 * @param assetSymbol   Símbolo do ativo (ex: "XLM", "USDC").
 * @param amount        Valor legível como string (ex: "100.00").
 * @returns XDR assemblado da transação em base64.
 */
export async function buildBlendTx(
  userPublicKey: string,
  action: BlendAction,
  assetSymbol: string,
  amount: string
): Promise<string> {
  // ── Validações ────────────────────────────────────────────────────────────
  if (!userPublicKey || !userPublicKey.startsWith("G")) {
    throw new Error(`userPublicKey inválida: "${userPublicKey}".`);
  }

  const requestType = ACTION_TO_REQUEST[action];
  if (requestType === undefined) {
    throw new Error(`Ação inválida: "${action}".`);
  }

  const assetAddress = BLEND_ASSETS[assetSymbol];
  if (!assetAddress) {
    throw new Error(
      `Ativo "${assetSymbol}" não é uma reserva suportada do pool Blend.`
    );
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error(`Valor inválido: "${amount}". Deve ser positivo.`);
  }

  // Converte para a unidade mínima (stroops, 7 decimais)
  const amountStroops = BigInt(Math.round(parsedAmount * SCALE));

  console.log(
    `[blend] Montando ${action} de ${amount} ${assetSymbol} | caller: ${userPublicKey}`
  );

  // ── Monta a operação via SDK do Blend ───────────────────────────────────────
  const server = new StellarSdk.rpc.Server(BLEND_NETWORK.rpc);
  const account = await server.getAccount(userPublicKey);

  const poolContract = new PoolContractV2(BLEND_POOL_ADDRESS);
  const opB64 = poolContract.submit({
    from: userPublicKey,
    spender: userPublicKey,
    to: userPublicKey,
    requests: [
      {
        request_type: requestType,
        address: assetAddress,
        amount: amountStroops,
      },
    ],
  });

  const operation = StellarSdk.xdr.Operation.fromXDR(opB64, "base64");

  // ── Monta a transação e simula (footprint + resource fees) ──────────────────
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: BLEND_NETWORK.passphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  // prepareTransaction = simulateTransaction + assembleTransaction.
  // Como from == source account, a autorização é "source account" — basta o
  // frontend assinar o envelope da transação (sem assinar auth entries).
  const prepared = await server.prepareTransaction(tx);

  const xdr = prepared.toXDR();
  console.log(`[blend] ✅ ${action} montado e simulado (${xdr.length} chars XDR)`);
  return xdr;
}

// ─── Leitura de dados do pool e posições do usuário ─────────────────────────────

export interface BlendReserveInfo {
  symbol: string;
  address: string;
  supplyApy: number;
  borrowApy: number;
  available: number;
  enabled: boolean;
}

export interface BlendUserPosition {
  collateral: number;
  supply: number;
  liabilities: number;
}

export interface BlendData {
  pool: string;
  reserves: BlendReserveInfo[];
  positions: Record<string, BlendUserPosition> | null;
}

/**
 * Carrega APYs/liquidez das reservas do pool e, opcionalmente, as posições do
 * usuário (colateral suprido e dívida). Em caso de falha, devolve um payload
 * vazio seguro (padrão do projeto: a UI nunca quebra por causa do on-chain).
 */
export async function getBlendData(
  userPublicKey?: string
): Promise<BlendData> {
  try {
    const pool = await PoolV2.load(BLEND_NETWORK, BLEND_POOL_ADDRESS);

    const reserves: BlendReserveInfo[] = [];
    for (const [address, reserve] of pool.reserves.entries()) {
      const supply = reserve.totalSupplyFloat();
      const liabilities = reserve.totalLiabilitiesFloat();
      reserves.push({
        symbol: BLEND_SYMBOL_BY_ADDRESS[address] || address,
        address,
        supplyApy: reserve.estSupplyApy,
        borrowApy: reserve.estBorrowApy,
        available: Math.max(0, supply - liabilities),
        // `enabled` só existe em ReserveConfigV2; o tipo base não o expõe.
        enabled: (reserve.config as { enabled?: boolean }).enabled ?? true,
      });
    }

    let positions: Record<string, BlendUserPosition> | null = null;
    if (userPublicKey && userPublicKey.startsWith("G")) {
      const user = await pool.loadUser(userPublicKey);
      positions = {};
      for (const [address, reserve] of pool.reserves.entries()) {
        const symbol = BLEND_SYMBOL_BY_ADDRESS[address] || address;
        const collateral = user.getCollateralFloat(reserve);
        const supply = user.getSupplyFloat(reserve);
        const liabilities = user.getLiabilitiesFloat(reserve);
        if (collateral > 0 || supply > 0 || liabilities > 0) {
          positions[symbol] = { collateral, supply, liabilities };
        }
      }
    }

    return { pool: BLEND_POOL_ADDRESS, reserves, positions };
  } catch (error) {
    console.warn(
      "[blend] Falha ao carregar dados do pool:",
      error instanceof Error ? error.message : String(error)
    );
    return { pool: BLEND_POOL_ADDRESS, reserves: [], positions: null };
  }
}
