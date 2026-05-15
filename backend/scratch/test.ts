import "dotenv/config";
import { etherfuseClient } from "../src/services/etherfuse/index";
import crypto from "crypto";

// Helper for dummy public key
import { Keypair } from "@stellar/stellar-sdk";

async function test() {
  try {
    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    console.log("Generated Dummy Wallet:", publicKey);
    
    // 1. Resolve Customer
    console.log("1. Resolving Customer...");
    const customer = await etherfuseClient.createCustomer({
      email: "test@vants.app",
      publicKey: publicKey,
    });
    const customerId = customer.id;
    console.log("Customer ID:", customerId);

    // 2. Submit KYC
    console.log("2. Submitting KYC...");
    await etherfuseClient.submitKycIdentity(customerId, {
      pubkey: publicKey,
      identity: {
        id: publicKey,
        name: { givenName: "Test", familyName: "User" },
        dateOfBirth: "1990-01-01",
        address: { street: "Rua", city: "SP", region: "SP", postalCode: "01310100", country: "BR" },
        idNumbers: [{ value: "12345678909", type: "CPF" }]
      }
    });

    // 3. Create Bank Account
    console.log("3. Creating Bank Account...");
    const bankRes = await fetch(`${process.env.ETHERFUSE_API_URL}/ramp/customer/${customerId}/bank-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.ETHERFUSE_API_KEY || "",
      },
      body: JSON.stringify({
        account: {
          transactionId: crypto.randomUUID(),
          pixKey: "user@vants.app",
          pixKeyType: "email",
          firstName: "Test",
          lastName: "User",
          cpf: "12345678909"
        }
      })
    });
    const bankData = await bankRes.json() as any;
    const bankAccountId = bankData.bankAccountId;
    console.log("Bank Account created:", bankAccountId);

    console.log("4. Fetching Quote (BRL)...");
    const quote = await etherfuseClient.getQuote({
        fromCurrency: "BRL", toCurrency: "TESOURO", fromAmount: "10", customerId, stellarAddress: publicKey
    });

    console.log("5. Creating OnRamp (BRL)...");
    const order = await etherfuseClient.createOnRamp({
        customerId, quoteId: quote.id, stellarAddress: publicKey, fromCurrency: "BRL", toCurrency: "TESOURO", amount: "10", bankAccountId
    });
    console.log("Order created successfully:", order.id);

    console.log("6. Fetching 2nd Quote (BRL)...");
    const quote2 = await etherfuseClient.getQuote({
        fromCurrency: "BRL", toCurrency: "TESOURO", fromAmount: "20", customerId, stellarAddress: publicKey
    });

    console.log("7. Creating 2nd OnRamp (BRL)...");
    const order2 = await etherfuseClient.createOnRamp({
        customerId, quoteId: quote2.id, stellarAddress: publicKey, fromCurrency: "BRL", toCurrency: "TESOURO", amount: "20", bankAccountId
    });
    console.log("2nd Order created successfully:", order2.id);

  } catch (err: any) {
    console.error("Fatal Error:", err.message);
  }
}
test();
