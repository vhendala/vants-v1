import { Keypair, TransactionBuilder, Networks, Operation } from "@stellar/stellar-sdk";
import { Horizon } from "@stellar/stellar-sdk";

const Server = Horizon.Server;

// Service that interacts with the Stellar Testnet for wallet provisioning.
// Uses Operation.createAccount to fund new user wallets on Testnet.

const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const server = new Server(HORIZON_TESTNET_URL);

export async function deploySmartWallet(passkeyPublicKey: string): Promise<string> {
  try {
    // Validate sponsor secret
    if (!process.env.STELLAR_SPONSOR_SECRET) {
      throw new Error("Missing STELLAR_SPONSOR_SECRET in environment");
    }

    console.log("[deploySmartWallet] Starting wallet deployment on Stellar Testnet");

    // Load sponsor keypair from secret
    let sponsorKeypair: any;
    try {
      sponsorKeypair = Keypair.fromSecret(process.env.STELLAR_SPONSOR_SECRET);
      console.log("[deploySmartWallet] Sponsor keypair loaded:", sponsorKeypair.publicKey());
    } catch (err: any) {
      throw new Error(`Invalid STELLAR_SPONSOR_SECRET: ${err?.message}`);
    }

    // Load sponsor account from Horizon
    let sponsorAccount: any;
    try {
      sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());
      console.log("[deploySmartWallet] Sponsor account loaded, sequence:", sponsorAccount.sequenceNumber);
    } catch (err: any) {
      console.error("[deploySmartWallet] Failed to load sponsor account from Horizon");
      console.error("[deploySmartWallet] Horizon error:", err?.response?.data);
      throw new Error(`Failed to load sponsor account: ${err?.message}`);
    }

    // Generate a new keypair for the user's wallet
    const newKeypair = Keypair.random();
    console.log("[deploySmartWallet] New wallet keypair generated:", newKeypair.publicKey());

    // Fetch current base fee from Horizon
    let fee: number;
    try {
      fee = await server.fetchBaseFee();
      console.log("[deploySmartWallet] Base fee fetched from Horizon:", fee);
    } catch (err: any) {
      console.error("[deploySmartWallet] Failed to fetch base fee from Horizon");
      console.error("[deploySmartWallet] Horizon error:", err?.response?.data);
      throw new Error(`Failed to fetch base fee: ${err?.message}`);
    }

    // Build the transaction to create the new account
    const tx = new TransactionBuilder(sponsorAccount, {
      fee: String(fee),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.createAccount({
          destination: newKeypair.publicKey(),
          startingBalance: "1.5",
        })
      )
      .setTimeout(30)
      .build();

    console.log("[deploySmartWallet] Transaction built, destination:", newKeypair.publicKey(), "starting balance: 1.5 XLM");

    // Sign transaction with sponsor keypair
    tx.sign(sponsorKeypair);
    console.log("[deploySmartWallet] Transaction signed with sponsor keypair");

    // Submit transaction to Horizon
    let result: any;
    try {
      result = await server.submitTransaction(tx);
      console.log("[deploySmartWallet] Transaction submitted successfully");
      console.log("[deploySmartWallet] Transaction hash:", result.hash);
      console.log("[deploySmartWallet] Ledger:", result.ledger);
    } catch (err: any) {
      console.error("[deploySmartWallet] Failed to submit transaction to Horizon");
      console.error("[deploySmartWallet] Horizon error response:", err?.response?.data);
      throw new Error(`Failed to submit transaction: ${err?.message}`);
    }

    console.log("[deploySmartWallet] Wallet deployment complete, address:", newKeypair.publicKey());

    // Return the new account public key so it can be stored by the caller
    return newKeypair.publicKey();
  } catch (err: any) {
    console.error("[deploySmartWallet] Error:", {
      message: err?.message,
      stack: err?.stack,
      horizonResponse: err?.response?.data,
    });
    throw err;
  }
}

export async function getWalletBalance(publicKey: string): Promise<string> {
  try {
    console.log("[getWalletBalance] Fetching balance for:", publicKey);

    // Load account from Horizon
    const account = await server.loadAccount(publicKey);
    console.log("[getWalletBalance] Account loaded successfully");

    // Find the native (XLM) balance
    const nativeBalance = account.balances.find(
      (balance: any) => balance.asset_type === "native"
    );

    if (!nativeBalance) {
      console.warn("[getWalletBalance] No native balance found for account:", publicKey);
      return "0.00";
    }

    const balance = String(nativeBalance.balance);
    console.log("[getWalletBalance] Native balance:", balance);

    return balance;
  } catch (err: any) {
    // If account not found (404), return 0.00
    if (err?.response?.status === 404 || err?.message?.includes("Not Found")) {
      console.warn("[getWalletBalance] Account not found on Horizon:", publicKey);
      return "0.00";
    }

    // For other errors, log and re-throw
    console.error("[getWalletBalance] Error fetching balance:", {
      message: err?.message,
      status: err?.response?.status,
      horizonResponse: err?.response?.data,
    });
    throw err;
  }
}

export default { deploySmartWallet, getWalletBalance };
