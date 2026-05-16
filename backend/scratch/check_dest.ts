
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
const destination = "GABRCTFYTRYFBAD737PQPJLRCG2EJHE6D6T4AT4VRCVFHFWWCPWD6N2M";

async function check() {
    try {
        const account = await server.loadAccount(destination);
        console.log("Account balances:", JSON.stringify(account.balances, null, 2));
    } catch (e: any) {
        if (e.response?.status === 404) {
            console.log("Account not found (404)");
        } else {
            console.error("Error:", e);
        }
    }
}
check();
