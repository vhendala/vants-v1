
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
const userWallet = "GCNY2GEKMIA35ORQ6XZDECH3STRZWVIAU4XVU2RDY4O3MIAZTSQX2UI4";

async function check() {
    try {
        const account = await server.loadAccount(userWallet);
        console.log("User Account balances:", JSON.stringify(account.balances, null, 2));
    } catch (e: any) {
        console.error("Error:", e);
    }
}
check();
