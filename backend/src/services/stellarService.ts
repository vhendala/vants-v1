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
