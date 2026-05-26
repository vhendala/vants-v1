/**
 * defindex/client.ts — Cliente server-side do SDK da Defindex.
 *
 * WHY: A VANTS utiliza a Defindex como motor de rendimentos (Vaults).
 * Este módulo inicializa o SDK e expõe funções para health-check e
 * construção de transações de depósito em USDC na rede Stellar (Testnet).
 *
 * O backend constrói a transação e retorna o XDR para o frontend (Privy)
 * assinar — fluxo 100 % não-custodial.
 *
 * @module defindex/client
 */

import {
  DefindexSDK,
  SupportedNetworks,
  type DepositToVaultParams,
} from "@defindex/sdk";

// ─── Configuração via variáveis de ambiente ────────────────────────────────────

const DEFINDEX_API_KEY = process.env.DEFINDEX_API_KEY;
const DEFINDEX_USDC_VAULT_ADDRESS = process.env.DEFINDEX_USDC_VAULT_ADDRESS;

if (!DEFINDEX_API_KEY) {
  console.warn(
    "[defindex] ⚠️  DEFINDEX_API_KEY não definida no .env — chamadas ao SDK irão falhar."
  );
}

// ─── Instância singleton do SDK ────────────────────────────────────────────────

const sdk = new DefindexSDK({
  apiKey: DEFINDEX_API_KEY ?? "",
  baseUrl: "https://api.defindex.io",
});

// ─── Health Check ──────────────────────────────────────────────────────────────

/**
 * Verifica se a API da Defindex está acessível e a chave é válida.
 *
 * @returns Objeto com `reachable: boolean` e detalhes opcionais.
 * @throws {Error} Se a requisição falhar por motivo de rede ou auth.
 *
 * @example
 * ```ts
 * const health = await checkDefindexHealth();
 * console.log(health.status.reachable); // true
 * ```
 */
export async function checkDefindexHealth(): Promise<{
  status: { reachable: boolean };
  [key: string]: unknown;
}> {
  try {
    console.log("[defindex] Verificando health da API Defindex...");
    const health = await sdk.healthCheck();
    console.log("[defindex] Health check OK:", JSON.stringify(health));
    return health;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error("[defindex] ❌ Health check falhou:", message);
    throw new Error(`Defindex health check falhou: ${message}`);
  }
}

// ─── Vault Info & APY ──────────────────────────────────────────────────────────

/**
 * Busca o APY atual do Vault de USDC na Defindex.
 * Em caso de falha (ex: API key ausente), retorna um APY padrão de fallback.
 */
export async function getUsdcVaultApy(): Promise<number> {
  const DEFAULT_APY = 7.5;
  
  if (!DEFINDEX_USDC_VAULT_ADDRESS) {
    console.warn("[defindex] DEFINDEX_USDC_VAULT_ADDRESS não definida. Retornando APY padrão.");
    return DEFAULT_APY;
  }

  try {
    const apyStr = await sdk.getVaultAPY(DEFINDEX_USDC_VAULT_ADDRESS, SupportedNetworks.TESTNET);
    const apy = parseFloat(apyStr);
    
    if (isNaN(apy)) {
      return DEFAULT_APY;
    }
    
    // Defindex SDK APY return is typically a percentage string, e.g., "7.5"
    return apy;
  } catch (error) {
    console.warn("[defindex] Falha ao buscar APY da Defindex. Usando valor padrão.", error instanceof Error ? error.message : String(error));
    return DEFAULT_APY;
  }
}

// ─── Depósito USDC no Vault ────────────────────────────────────────────────────

/**
 * Constrói uma transação de depósito de USDC no Vault da Defindex.
 *
 * A transação é retornada como XDR (base64) **não-assinada**, pronta para
 * ser enviada ao frontend onde a carteira do usuário (Privy) irá assinar.
 *
 * @param userPublicKey - Chave pública Stellar (G...) do depositante.
 * @param amount - Valor do depósito como string (ex: "100.00").
 *                 Será convertido para a unidade mínima do asset (7 decimais).
 * @returns XDR da transação de depósito em formato base64.
 * @throws {Error} Se a vault não estiver configurada ou a construção falhar.
 *
 * @example
 * ```ts
 * const xdr = await buildUsdcDepositTransaction(
 *   "GABC...XYZ",
 *   "250.00"
 * );
 * // Enviar `xdr` ao frontend para assinatura via Privy
 * ```
 */
export async function buildUsdcDepositTransaction(
  userPublicKey: string,
  amount: string
): Promise<string> {
  // ── Validações ──────────────────────────────────────────────────────────────

  if (!DEFINDEX_USDC_VAULT_ADDRESS) {
    throw new Error(
      "[defindex] DEFINDEX_USDC_VAULT_ADDRESS não definida no .env. " +
        "Configure o endereço do Vault de USDC antes de construir depósitos."
    );
  }

  if (!userPublicKey || !userPublicKey.startsWith("G")) {
    throw new Error(
      `[defindex] userPublicKey inválida: "${userPublicKey}". ` +
        "Esperado uma chave pública Stellar válida (G...)."
    );
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error(
      `[defindex] Valor de depósito inválido: "${amount}". ` +
        "O valor deve ser um número positivo."
    );
  }

  // ── Construção da transação ─────────────────────────────────────────────────

  try {
    console.log(
      `[defindex] Construindo depósito: ${amount} USDC → Vault ${DEFINDEX_USDC_VAULT_ADDRESS} | caller: ${userPublicKey}`
    );

    // Converte o valor legível para a unidade mínima do asset (Stellar usa 7 decimais)
    const amountInStroops = Math.round(parsedAmount * 1e7);

    const depositParams: DepositToVaultParams = {
      amounts: [amountInStroops],
      caller: userPublicKey,
      invest: true, // Auto-invest: os fundos são alocados imediatamente na estratégia do vault
      slippageBps: 100, // 1 % de tolerância a slippage — padrão conservador
    };

    const response = await sdk.depositToVault(
      DEFINDEX_USDC_VAULT_ADDRESS,
      depositParams,
      SupportedNetworks.TESTNET
    );

    // O SDK retorna o XDR da transação construída
    const xdr: string =
      typeof response === "string" ? response : (response as any).xdr ?? (response as any).toXDR?.() ?? String(response);

    console.log(
      `[defindex] ✅ Transação de depósito construída com sucesso (${xdr.length} chars XDR)`
    );

    return xdr;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(
      `[defindex] ❌ Falha ao construir transação de depósito:`,
      message
    );
    throw new Error(`Falha ao construir depósito Defindex: ${message}`);
  }
}
