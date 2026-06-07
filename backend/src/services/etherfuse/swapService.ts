/**
 * swapService.ts — Serviço de Swap TESOURO → USDC via Etherfuse.
 *
 * WHY: A VANTS permite ao usuário "converter BRL → USD" na interface,
 * mas por baixo dos panos o que acontece é um swap do token TESOURO
 * (emitido pela Etherfuse, representando BRL) para USDC.
 *
 * Estratégia de integração:
 *   1. Tenta usar a API de cotação da Etherfuse com `type: 'swap'`
 *   2. Se a API não suportar swap direto no sandbox, constrói uma
 *      transação Stellar `pathPaymentStrictSend` como fallback
 *
 * O backend NUNCA assina — retorna XDR para assinatura no cliente.
 *
 * @module etherfuse/swapService
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { etherfuseClient } from "./index";

// ─── Configuração ─────────────────────────────────────────────────────────────

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

const TESOURO_ISSUER =
  process.env.TESOURO_ISSUER_PUBLIC_KEY ||
  "GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4";

const TESOURO_ASSET_IDENTIFIER =
  process.env.TESOURO_ASSET_IDENTIFIER ||
  `TESOURO:${TESOURO_ISSUER}`;

// USDC issuer da Etherfuse na Testnet
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// Etherfuse customer/bank para quotes (do .env)
const ETHERFUSE_CUSTOMER_ID = process.env.ETHERFUSE_CUSTOMER_ID || "";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SwapQuote {
  /** Taxa de câmbio TESOURO → USDC */
  rate: string;
  /** Valor de origem (em TESOURO/BRL) */
  fromAmount: string;
  /** Valor de destino (em USDC/USD) */
  toAmount: string;
  /** Taxa cobrada */
  fee: string;
  /** ID da cotação (para criar order) */
  quoteId: string;
}

export interface SwapResult {
  /** XDR da transação pronta para assinatura */
  xdr: string;
  /** Resumo da cotação aplicada na transação */
  quote: SwapQuote;
}

// ─── Obtenção de Cotação (Etherfuse Sandbox) ──────────────────────────────────

/**
 * Solicita uma cotação (Quote) da Etherfuse ou faz fallback local
 * para exibir as taxas antes do usuário confirmar.
 */
export async function getSwapQuote(
  publicKey: string,
  amount: string
): Promise<SwapQuote> {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Valor de conversão deve ser um número positivo.");
  }

  try {
    console.log(
      `[swapService] Solicitando cotação Etherfuse: ${amount} TESOURO → USDC | wallet: ${publicKey}`
    );

    const quote = await etherfuseClient.getQuote({
      fromCurrency: TESOURO_ASSET_IDENTIFIER,
      toCurrency: "USDC",
      fromAmount: amount,
      customerId: ETHERFUSE_CUSTOMER_ID,
      stellarAddress: publicKey,
    });

    const extractedRate = (quote as any).exchangeRate || (quote as any).rate || (quote as any).price;
    const toAmount = (quote as any).destinationAmount || (quote as any).toAmount;
    const fromAmount = (quote as any).sourceAmount || (quote as any).fromAmount;
    const fee = (quote as any).feeAmount || (quote as any).fee;
    const quoteId = (quote as any).quoteId || (quote as any).id;

    console.log(
      `[swapService] ✅ Cotação Etherfuse recebida: rate=${extractedRate}, to=${toAmount}`
    );

    return {
      rate: String(extractedRate),
      fromAmount: String(fromAmount),
      toAmount: String(toAmount),
      fee: String(fee),
      quoteId: String(quoteId),
    };
  } catch (err: any) {
    console.warn(
      `[swapService] ⚠️ Etherfuse quote falhou (${err.message}). Usando fallback local.`
    );

    const fallbackRate = "0.19";
    const toAmount = (parsedAmount * parseFloat(fallbackRate)).toFixed(2);

    return {
      rate: fallbackRate,
      fromAmount: amount,
      toAmount,
      fee: "0",
      quoteId: `local-${Date.now()}`,
    };
  }
}

// ─── Construção da transação de Swap ──────────────────────────────────────────

/**
 * buildSwapTransaction
 *
 * Constrói um XDR atômico (1-Phase) que executa:
 *   1. changeTrust para USDC (Etherfuse)
 *   2. pathPaymentStrictSend de TESOURO para USDC usando a liquidity da SDEX
 *
 * WHY: Como existe liquidez nativa na Stellar DEX (SDEX) para este par na testnet,
 * não precisamos simular a emissão no backend. O swap ocorre em uma única transação atômica!
 *
 * @param publicKey - Chave pública Stellar do usuário
 * @param amount - Valor de TESOURO a converter
 * @returns Objeto SwapResult com XDR e cotação
 */
export async function buildSwapTransaction(
  publicKey: string,
  amount: string
): Promise<SwapResult> {
  const quote = await getSwapQuote(publicKey, amount);

  try {
    console.log(
      `[swapService] Construindo transação atômica: ${amount} TESOURO → USDC | caller: ${publicKey}`
    );

    const sourceAccount = await server.loadAccount(publicKey);
    const tesouroAsset = new StellarSdk.Asset("TESOURO", TESOURO_ISSUER);
    const usdcAsset = new StellarSdk.Asset("USDC", USDC_ISSUER);

    // Consulta os paths disponíveis na Horizon para o Strict Send
    const paths = await server.strictSendPaths(tesouroAsset, amount, [usdcAsset]).call();
    
    if (!paths.records || paths.records.length === 0) {
      throw new Error("Sem liquidez na SDEX para converter TESOURO para USDC.");
    }
    
    const bestPath = paths.records[0];
    const expectedOutput = parseFloat(bestPath.destination_amount);
    
    // Aplicamos um slippage de 2% para segurança
    const minDestinationAmount = (expectedOutput * 0.98).toFixed(7);

    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    // 1. Abre a trustline para o verdadeiro Etherfuse USDC
    txBuilder.addOperation(
      StellarSdk.Operation.changeTrust({
        asset: usdcAsset,
        source: publicKey,
      })
    );

    // 2. Faz o Swap direto na SDEX
    txBuilder.addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: tesouroAsset,
        sendAmount: parseFloat(amount).toFixed(7),
        destAsset: usdcAsset,
        destMin: minDestinationAmount,
        destination: publicKey,
        path: bestPath.path.map((p: any) => new StellarSdk.Asset(p.asset_code, p.asset_issuer)),
        source: publicKey,
      })
    );

    const tx = txBuilder.setTimeout(120).build();
    const xdr = tx.toXDR();

    console.log(
      `[swapService] ✅ XDR de Swap Atômico construído (${xdr.length} chars) - Destino Mínimo: ${minDestinationAmount} USDC`
    );

    return { xdr, quote };
  } catch (err: any) {
    console.error(`[swapService] ❌ Falha ao construir swap:`, err.message);

    if (err.message?.includes("404")) {
      throw new Error(
        "Conta não encontrada na rede. Verifique se sua carteira está ativada."
      );
    }
    if (err.message?.includes("op_underfunded")) {
      throw new Error("Saldo insuficiente para esta conversão.");
    }
    throw new Error(
      err.message || "Falha ao preparar a conversão. Tente novamente."
    );
  }
}
