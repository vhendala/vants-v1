import * as StellarSdk from "@stellar/stellar-sdk";
const pk = "GARE7ITTDDEZKGGVNQT7O5A5WKZ7EYB3IL6F5QOFLYXJRP23GYEZQIGU";
const kp = StellarSdk.Keypair.fromPublicKey(pk);
console.log("Expected Hint:", kp.signatureHint().toString("hex"));
