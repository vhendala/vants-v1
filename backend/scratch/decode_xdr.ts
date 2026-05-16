
import * as StellarSdk from "@stellar/stellar-sdk";

const xdr = "AAAAAgAAAACbjRiKYgG%2BujD18jII%2B5Tjm1UApy9aaiPHHbYgGZyhfQAAAGQAJ3cnAAAAAwAAAAEAAAAAAAAAAAAAAABqCH0CAAAAAAAAAAEAAAAAAAAAAQAAAAADEUy4nHBQgH%2Ff3welcRG0RJyeH6fAT5WIqlOW1hPsPwAAAAJURVNPVVJPAAAAAAAAAAAAtit8g8RnaHt9qNBselzNC9X6cPgBxlpfWSAwrpLN6%2FoAAAAAO5rKAAAAAAAAAAABGZyhfQAAAEDkhSdb1UhAH0u%2FOP5dE%2F9ctz474oENdP9t8b0m%2BdWnuDQabztr1JeaHVTrp%2BEwnf39cktlR%2B%2BnbuXRNsQ0%2F00E";
const decodedXdr = decodeURIComponent(xdr);

try {
    const tx = new StellarSdk.Transaction(decodedXdr, StellarSdk.Networks.TESTNET);
    console.log("Source Account:", tx.source);
    console.log("Operations:", JSON.stringify(tx.operations, null, 2));
} catch (e) {
    console.error("Error decoding XDR:", e);
}
