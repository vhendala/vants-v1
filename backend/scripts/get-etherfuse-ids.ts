/**
 * get-etherfuse-ids.ts
 *
 * Script utilitário para descobrir os IDs de Customer e Bank Account
 * já cadastrados no Sandbox da Etherfuse via API Key.
 *
 * Uso: npx tsx scripts/get-etherfuse-ids.ts
 */

import "dotenv/config";

const API_URL = process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com";
const API_KEY = process.env.ETHERFUSE_API_KEY || "";

if (!API_KEY) {
  console.error("❌ ETHERFUSE_API_KEY não encontrada no .env");
  process.exit(1);
}

async function fetchEtherfuse<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

async function main() {
  console.log("🔑 API Key:", API_KEY.slice(0, 20) + "...");
  console.log("🌐 API URL:", API_URL);
  console.log("");

  // 1. Listar Customers
  console.log("━━━ CUSTOMERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const customers = await fetchEtherfuse<any>("/ramp/customer");
    const list = Array.isArray(customers) ? customers : customers?.data ?? customers?.customers ?? [customers];
    
    if (list.length === 0) {
      console.log("Nenhum customer encontrado.");
    } else {
      list.forEach((c: any, i: number) => {
        console.log(`\n  Customer #${i + 1}:`);
        console.log(`    ID:    ${c.id || c.customerId || "N/A"}`);
        console.log(`    Name:  ${c.name || c.firstName || "N/A"}`);
        console.log(`    Email: ${c.email || "N/A"}`);
        console.log(`    Status: ${c.status || c.kycStatus || "N/A"}`);
      });
    }
  } catch (err: any) {
    console.log("  Tentando endpoint alternativo...");
    try {
      const customers = await fetchEtherfuse<any>("/ramp/customers");
      const list = Array.isArray(customers) ? customers : customers?.data ?? customers?.customers ?? [customers];
      list.forEach((c: any, i: number) => {
        console.log(`\n  Customer #${i + 1}:`);
        console.log(`    ID:    ${c.id || c.customerId || JSON.stringify(c).slice(0, 100)}`);
        console.log(`    Name:  ${c.name || c.firstName || "N/A"}`);
        console.log(`    Email: ${c.email || "N/A"}`);
      });
    } catch (err2: any) {
      console.error("  ❌ Erro ao listar customers:", err2.message);
    }
  }

  console.log("\n━━━ BANK ACCOUNTS ━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const banks = await fetchEtherfuse<any>("/ramp/bank-account");
    const list = Array.isArray(banks) ? banks : banks?.data ?? banks?.bankAccounts ?? [banks];

    if (list.length === 0) {
      console.log("Nenhuma bank account encontrada.");
    } else {
      list.forEach((b: any, i: number) => {
        console.log(`\n  Bank Account #${i + 1}:`);
        console.log(`    ID:     ${b.id || b.bankAccountId || "N/A"}`);
        console.log(`    CLABE:  ${b.clabe || b.accountNumber || "N/A"}`);
        console.log(`    Bank:   ${b.bankName || b.bank || "N/A"}`);
        console.log(`    Status: ${b.status || "N/A"}`);
        console.log(`    Customer ID: ${b.customerId || "N/A"}`);
      });
    }
  } catch (err: any) {
    console.log("  Tentando endpoint alternativo...");
    try {
      const banks = await fetchEtherfuse<any>("/ramp/bank-accounts");
      const list = Array.isArray(banks) ? banks : banks?.data ?? banks?.bankAccounts ?? [banks];
      list.forEach((b: any, i: number) => {
        console.log(`\n  Bank Account #${i + 1}:`);
        console.log(`    ID:     ${b.id || b.bankAccountId || JSON.stringify(b).slice(0, 100)}`);
        console.log(`    Customer ID: ${b.customerId || "N/A"}`);
      });
    } catch (err2: any) {
      console.error("  ❌ Erro ao listar bank accounts:", err2.message);
    }
  }

  // 3. Listar Wallets (bônus)
  console.log("\n━━━ CRYPTO WALLETS ━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    const wallets = await fetchEtherfuse<any>("/ramp/wallet");
    const list = Array.isArray(wallets) ? wallets : wallets?.data ?? wallets?.wallets ?? [wallets];

    list.forEach((w: any, i: number) => {
      console.log(`\n  Wallet #${i + 1}:`);
      console.log(`    ID:         ${w.id || w.walletId || "N/A"}`);
      console.log(`    PublicKey:  ${w.publicKey || w.address || "N/A"}`);
      console.log(`    Blockchain: ${w.blockchain || "N/A"}`);
      console.log(`    Customer ID: ${w.customerId || "N/A"}`);
    });
  } catch (err: any) {
    try {
      const wallets = await fetchEtherfuse<any>("/ramp/wallets");
      const list = Array.isArray(wallets) ? wallets : wallets?.data ?? [wallets];
      list.forEach((w: any, i: number) => {
        console.log(`\n  Wallet #${i + 1}:`);
        console.log(`    ID:         ${w.id || w.walletId || JSON.stringify(w).slice(0, 100)}`);
      });
    } catch {
      console.log("  Nenhuma wallet encontrada ou endpoint indisponível.");
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Copie os IDs acima e cole no .env:");
  console.log('   ETHERFUSE_CUSTOMER_ID="<customer_id>"');
  console.log('   ETHERFUSE_BANK_ACCOUNT_ID="<bank_account_id>"');
}

main().catch(console.error);
