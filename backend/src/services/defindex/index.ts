/**
 * defindex/index.ts — Barrel export do módulo Defindex.
 *
 * Re-exporta as funções do client para consumo pelas rotas.
 */

export { checkDefindexHealth, buildUsdcDepositTransaction, buildUsdcWithdrawTransaction, getUsdcVaultApy, getUsdcVaultBalance } from "./client";
