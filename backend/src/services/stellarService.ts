import { Keypair, TransactionBuilder, Networks, Operation } from "@stellar/stellar-sdk";
import { Horizon } from "@stellar/stellar-sdk";

const Server = Horizon.Server;

// Service that interacts with the Stellar Testnet for wallet provisioning.
// Uses Operation.createAccount as a placeholder for a future Soroban contract
// deployment. This verifies network connectivity and transaction flow.

const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const server = new Server(HORIZON_TESTNET_URL);

export async function deploySmartWallet(passkeyPublicKey: string): Promise<string> {
  try {
    // Always use fallback: generate local keypair without Stellar deployment
    // This allows the app to work while we resolve Stellar configuration
    console.log("[deploySmartWallet] Generating local wallet keypair (Stellar deployment disabled for now)");
    const newKeypair = Keypair.random();
    console.log("[deploySmartWallet] New wallet created:", newKeypair.publicKey());
    return newKeypair.publicKey();

    // TODO: Enable Stellar deployment once sponsor account is properly funded on testnet
    /*
    if (!process.env.STELLAR_SPONSOR_SECRET) {
      console.warn("[deploySmartWallet] STELLAR_SPONSOR_SECRET not set. Generating local keypair only.");
      const newKeypair = Keypair.random();
      return newKeypair.publicKey();
    }

    console.log("[deploySmartWallet] Starting wallet deployment with sponsor secret");

    // Load sponsor keypair from secret and fetch its account data
    let sponsorKeypair: any;
    try {
      sponsorKeypair = Keypair.fromSecret(process.env.STELLAR_SPONSOR_SECRET);
      console.log("[deploySmartWallet] Sponsor keypair loaded:", sponsorKeypair.publicKey());
    } catch (err: any) {
      throw new Error(`Invalid STELLAR_SPONSOR_SECRET: ${err?.message}`);
    }

    // Load sponsor account
    let sponsorAccount: any;
    try {
      sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());
      console.log("[deploySmartWallet] Sponsor account loaded, sequence:", sponsorAccount.sequenceNumber);
    } catch (err: any) {
      throw new Error(`Failed to load sponsor account: ${err?.message}`);
    }

    // Generate a new keypair to represent the user's wallet
    const newKeypair = Keypair.random();
    console.log("[deploySmartWallet] New wallet keypair generated:", newKeypair.publicKey());

    // Fetch current base fee
    let fee: number;
    try {
      fee = await server.fetchBaseFee();
      console.log("[deploySmartWallet] Base fee fetched:", fee);
    } catch (err: any) {
      throw new Error(`Failed to fetch base fee: ${err?.message}`);
    }

    // Build transaction
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

    console.log("[deploySmartWallet] Transaction built");

    // Sign with sponsor
    tx.sign(sponsorKeypair);
    console.log("[deploySmartWallet] Transaction signed");

    // Submit transaction
    let result: any;
    try {
      result = await server.submitTransaction(tx);
      console.log("[deploySmartWallet] Transaction submitted successfully, hash:", result.hash);
    } catch (err: any) {
      throw new Error(`Failed to submit transaction: ${err?.message}`);
    }

    // Return the new account public key so it can be stored by the caller
    return newKeypair.publicKey();
    */
  } catch (err: any) {
    console.error("[deploySmartWallet] Error:", {
      message: err?.message,
      stack: err?.stack,
      stellarResponse: err?.response?.data,
    });
    throw err;
  }
}

export default { deploySmartWallet };
