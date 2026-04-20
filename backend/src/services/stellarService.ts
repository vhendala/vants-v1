import { Keypair, TransactionBuilder, Networks, Operation } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

// Service that interacts with the Stellar Testnet for wallet provisioning.
// Uses Operation.createAccount as a placeholder for a future Soroban contract
// deployment. This verifies network connectivity and transaction flow.

const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const server = new Server(HORIZON_TESTNET_URL);

export async function deploySmartWallet(passkeyPublicKey: string): Promise<string> {
  try {
    if (!process.env.STELLAR_SPONSOR_SECRET) {
      throw new Error("Missing STELLAR_SPONSOR_SECRET in environment");
    }

    // Load sponsor keypair from secret and fetch its account data
    const sponsorKeypair = Keypair.fromSecret(process.env.STELLAR_SPONSOR_SECRET);
    const sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());

    // Generate a new keypair to represent the user's wallet (placeholder)
    const newKeypair = Keypair.random();

    // Fetch current base fee and build the transaction
    const fee = await server.fetchBaseFee();

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
      // 30 second timeout
      .setTimeout(30)
      .build();

    // Sign with sponsor and submit
    tx.sign(sponsorKeypair);

    const result = await server.submitTransaction(tx);

    console.log("Stellar transaction submitted:", result.hash);

    // Return the new account public key so it can be stored by the caller
    return newKeypair.publicKey();
  } catch (err: any) {
    // Log Stellar Horizon response body when available for debugging
    console.error("Error in deploySmartWallet:", err);
    if (err?.response?.data) {
      console.error("Stellar Horizon response:", err.response.data);
    }
    // Re-throw so calling code can handle the error
    throw err;
  }
}

export default { deploySmartWallet };
