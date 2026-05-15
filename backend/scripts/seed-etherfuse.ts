/**
 * seed-etherfuse.ts
 *
 * Cria um Customer e uma Bank Account fictícios no Sandbox da Etherfuse,
 * configurados puramente para o fluxo brasileiro (BRL / Pix).
 *
 * Uso: npx tsx scripts/seed-etherfuse.ts
 */

import "dotenv/config";
import crypto from "crypto";

const API_URL = process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com";
const API_KEY = process.env.ETHERFUSE_API_KEY || "";

if (!API_KEY) {
  console.error("❌ ETHERFUSE_API_KEY não encontrada no .env");
  process.exit(1);
}

async function etherfuseFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "No body");
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function main() {
  console.log("🚀 Iniciando Seed na Etherfuse (Sandbox BRL/Pix)...");

  // 1. Criar Customer Org
  const customerId = crypto.randomUUID();
  console.log(`\n⏳ Criando Customer (ID: ${customerId})...`);
  
  try {
    const orgPayload = {
      id: customerId,
      displayName: "João da Silva",
      accountType: "personal",
      userInfo: {
        email: "joao.silva@example.com",
        displayName: "João da Silva"
      },
      wallets: [
        {
          publicKey: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTFEMGH2BEWFG4BRCEYQFFF",
          blockchain: "stellar"
        }
      ]
    };

    await etherfuseFetch("/ramp/organization", {
      method: "POST",
      body: JSON.stringify(orgPayload)
    });
    console.log("✅ Customer criado com sucesso!");

    // 1.5 Submeter KYC (Auto-Aprova o Customer no Sandbox)
    console.log(`\n⏳ Submetendo KYC para ativar o Customer...`);
    const kycPayload = {
      pubkey: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTFEMGH2BEWFG4BRCEYQFFF", // chave pública fake qualquer
      identity: {
        id: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTFEMGH2BEWFG4BRCEYQFFF",
        email: "joao.silva@example.com",
        phoneNumber: "+5511999999999",
        occupation: "Software Engineer",
        name: {
          givenName: "João",
          familyName: "Silva"
        },
        dateOfBirth: "1990-01-01",
        address: {
          street: "Av. Paulista",
          city: "São Paulo",
          region: "SP",
          postalCode: "01310100",
          country: "BR"
        }
      }
    };
    
    await etherfuseFetch(`/ramp/customer/${customerId}/kyc`, {
      method: "POST",
      body: JSON.stringify(kycPayload)
    });
    console.log("✅ KYC submetido (Customer Aprovado)!");

    // 2. Criar Bank Account (Pix/BRL)
    const transactionId = crypto.randomUUID();
    console.log(`\n⏳ Cadastrando Bank Account (Pix) para Customer ${customerId}...`);
    
    const bankAccountPayload = {
      account: {
        transactionId,
        firstName: "João",
        paternalLastName: "Silva",
        maternalLastName: "Souza",
        birthDate: "19900101",
        birthCountryIsoCode: "BR", // O país de nascimento pode ser BR, mas os docs exigem os IDs do México
        
        // A Etherfuse exige os campos mexicanos (RFC, CURP, CLABE) para o cadastro de Bank Account.
        // Nosso fluxo Pix/BRL é uma máscara feita no frontend. A API real precisa destes dados para aceitar o POST.
        curp: "GAJU900515HDFRNN09",
        rfc: "GAJU9005156V3",
        clabe: "012345678901234567"
      }
    };

    const bankRes = await etherfuseFetch<any>(`/ramp/customer/${customerId}/bank-account`, {
      method: "POST",
      body: JSON.stringify(bankAccountPayload)
    });

    const bankAccountId = bankRes.bankAccountId || bankRes.id;
    console.log("✅ Bank Account criada com sucesso!");

    console.log("\n🎉 SEED CONCLUÍDO!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👉 ETHERFUSE_CUSTOMER_ID="${customerId}"`);
    console.log(`👉 ETHERFUSE_BANK_ACCOUNT_ID="${bankAccountId}"`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nAtualize seu arquivo .env com os IDs acima!");

  } catch (error: any) {
    console.error("\n❌ Erro durante o seed:");
    console.error(error.message);
  }
}

main().catch(console.error);
