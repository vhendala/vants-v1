/**
 * blend/config.ts — Configuração da integração com o Blend (Soroban, Testnet).
 *
 * WHY: A VANTS usa o Blend como protocolo de empréstimo ("Borrow & Pay"
 * Orchestrator). Centralizamos aqui os IDs dos contratos do pool de testnet e os
 * parâmetros de rede. Todos os valores têm default de testnet, mas podem ser
 * sobrescritos por variáveis de ambiente.
 *
 * Fonte dos endereços: blend-utils `testnet.contracts.json` (pool TestnetV2).
 *
 * @module blend/config
 */

/** Configuração de rede no formato que o `@blend-capital/blend-sdk` espera. */
export const BLEND_NETWORK = {
  rpc: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  passphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
} as const;

/** Endereço do pool de empréstimos do Blend (V2) na Testnet. */
export const BLEND_POOL_ADDRESS =
  process.env.BLEND_POOL_ADDRESS ||
  "CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF";

/**
 * Mapa símbolo → contract id (Stellar Asset Contract / token Soroban) das
 * reservas suportadas pelo pool. Todos os tokens de teste do Blend usam 7 casas
 * decimais (padrão Stellar).
 */
export const BLEND_ASSETS: Record<string, string> = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  USDC: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
  wETH: "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE",
  wBTC: "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI",
};

/** Mapa inverso (contract id → símbolo) para resolver reservas lidas on-chain. */
export const BLEND_SYMBOL_BY_ADDRESS: Record<string, string> = Object.fromEntries(
  Object.entries(BLEND_ASSETS).map(([symbol, address]) => [address, symbol])
);

/** Todas as reservas do Blend de teste usam 7 casas decimais. */
export const BLEND_DECIMALS = 7;

/** Ações suportadas pelo orquestrador, mapeadas para `RequestType` do SDK. */
export type BlendAction = "supply" | "withdraw" | "borrow" | "repay";
