import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * stellarService.ts
 *
 * Serviço atualizado para fluxo Hi-Li (USDC nativo).
 */

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Chaves do Emissor (Hi-Li Mock)
const ISSUER_PUBLIC_KEY = process.env.ISSUER_PUBLIC_KEY || "";
const ISSUER_SECRET_KEY = process.env.ISSUER_SECRET_KEY || "";

// Emissor do ativo TESOURO (Etherfuse — Stellar Testnet)
const TESOURO_ISSUER_PUBLIC_KEY =
  process.env.TESOURO_ISSUER_PUBLIC_KEY ||
  "GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4";
const TESOURO_ASSET_CODE = "TESOURO";

/**
 * Etapa 1: Ativa a conta na Testnet via Friendbot (ganha 10.000 XLM).
 */
export async function activateAccountWithFriendbot(publicKey: string): Promise<string> {
  console.log(`[stellarService] Activating account via Friendbot: ${publicKey}`);
  const friendbotUrl = `https://friendbot.stellar.org/?addr=${publicKey}`;
  const response = await fetch(friendbotUrl);
  
  if (!response.ok) {
    throw new Error("Falha ao ativar conta via Friendbot.");
  }
  
  const data = (await response.json()) as { hash: string };
  console.log(`[stellarService] Friendbot success, txHash: ${data.hash}`);
  return data.hash;
}

/**
 * Etapa 2: Submete o XDR da Trustline assinado pelo cliente.
 */
export async function submitSignedTransaction(xdr: string): Promise<string> {
  console.log("[stellarService] Submitting signed transaction XDR...");
  const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, StellarSdk.Networks.TESTNET);
  const response = await server.submitTransaction(tx);
  return response.hash;
}

/**
 * Etapa 3: Emite 10.000 USDC para o usuário (Depósito PIX).
 */
export async function sendUsdcPayment(destination: string): Promise<string> {
  if (!ISSUER_SECRET_KEY || !ISSUER_PUBLIC_KEY) {
    throw new Error("Configuração do emissor USDC ausente no .env");
  }

  const issuerKeypair = StellarSdk.Keypair.fromSecret(ISSUER_SECRET_KEY);
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
  
  const usdcAsset = new StellarSdk.Asset("USDC", ISSUER_PUBLIC_KEY);

  const tx = new StellarSdk.TransactionBuilder(issuerAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: usdcAsset,
        amount: "10000.00",
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair);
  const response = await server.submitTransaction(tx);
  return response.hash;
}

/**
 * Consulta saldo de USDC do usuário.
 */
export async function getUsdcBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const usdcLine = account.balances.find(
      (b: any) =>
        b.asset_code === "USDC" && b.asset_issuer === ISSUER_PUBLIC_KEY
    );
    return usdcLine ? usdcLine.balance : "0.00";
  } catch (err: any) {
    if (err?.response?.status === 404) return "0.00";
    throw err;
  }
}

/**
 * Constrói uma transação de transferência de USDC não assinada (XDR).
 */
export async function buildTransferUsdcTransaction(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
): Promise<string> {
  if (!ISSUER_PUBLIC_KEY) {
    throw new Error("Configuração do emissor USDC ausente no .env");
  }

  // 1. Carrega a conta de origem
  const sourceAccount = await server.loadAccount(sourcePublicKey);
  
  // 2. Define o asset USDC
  const usdcAsset = new StellarSdk.Asset("USDC", ISSUER_PUBLIC_KEY);

  // 3. Constrói a transação
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: usdcAsset,
        amount: amount,
      })
    )
    .setTimeout(60) // 60 segundos para o usuário assinar e submeter
    .build();

  // Retorna a transação em formato XDR (base64) para ser assinada no cliente
  return tx.toXDR();
}

/**
 * Constrói uma transação não assinada (XDR) para enviar TESOURO para a carteira fixa de saque (Fake Off-Ramp).
 */
export async function buildWithdrawTesouroTransaction(
  sourcePublicKey: string,
  amount: string
): Promise<string> {
  const destinationPublicKey = "GABRCTFYTRYFBAD737PQPJLRCG2EJHE6D6T4AT4VRCVFHFWWCPWD6N2M";
  if (!TESOURO_ISSUER_PUBLIC_KEY) {
    throw new Error("Configuração do emissor TESOURO ausente no .env");
  }

  // 1. Carrega a conta de origem
  const sourceAccount = await server.loadAccount(sourcePublicKey);
  
  // 2. Define o asset TESOURO
  const tesouroAsset = new StellarSdk.Asset("TESOURO", TESOURO_ISSUER_PUBLIC_KEY);

  // 3. Constrói a transação
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: tesouroAsset,
        amount: amount,
      })
    )
    .setTimeout(60) // 60 segundos para assinar e submeter
    .build();

  return tx.toXDR();
}

// ─── Funções TESOURO (Etherfuse) ──────────────────────────────────────────────

/**
 * Verifica se a conta possui trustline para um ativo específico.
 */
export async function checkTrustline(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<boolean> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.some(
      (b: any) => b.asset_code === assetCode && b.asset_issuer === assetIssuer
    );
  } catch (err: any) {
    if (err?.response?.status === 404) return false;
    throw err;
  }
}

/**
 * Constrói uma transação ChangeTrust não assinada para o ativo TESOURO.
 */
export async function buildChangeTrustTransaction(
  publicKey: string,
  assetCode: string = TESOURO_ASSET_CODE,
  assetIssuer: string = TESOURO_ISSUER_PUBLIC_KEY
): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const asset = new StellarSdk.Asset(assetCode, assetIssuer);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();

  return tx.toXDR();
}

/**
 * Consulta saldo do ativo TESOURO do usuário.
 */
export async function getTesouroBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const tesouroLine = account.balances.find(
      (b: any) =>
        b.asset_code === TESOURO_ASSET_CODE &&
        b.asset_issuer === TESOURO_ISSUER_PUBLIC_KEY
    );
    return tesouroLine ? tesouroLine.balance : "0.00";
  } catch (err: any) {
    if (err?.response?.status === 404) return "0.00";
    throw err;
  }
}
