import * as StellarSdk from "@stellar/stellar-sdk";

const xdr = "AAAAAgAAAAAiT6JzGMmVGNVsJ/d0HbKz8mA7QvxewcVeLpi/WzYJmAAAAGQAJOw4AAAAAgAAAAEAAAAAAAAAAAAAAABp+8rMAAAAAAAAAAEAAAAAAAAAAQAAAACAlczJXW9Q1DDppt22vnHSK+yBZeN2G6C1BTkE+dxzzAAAAAFVU0RDAAAAAJGdyMkdMGB4frmkGfr513cP/x+IsOGuz3JXwXrDReL5AAAAADuaygAAAAAAAAAAAVs2CZgAAABAbZEX81j/xmfzkUqHLmg97uYjO5LO0Sqkh+poo+RDAQ6tNS9CmRKqsLVOXY8AlGxPYc3Nxhf28xjyQPQ02JDBDg==";

const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
console.log("Network Passphrase of tx:", tx.networkPassphrase);
const hash = tx.hash();
console.log("Hash:", hash.toString("hex"));

const keypair = StellarSdk.Keypair.fromPublicKey(tx.source);
const isValid = keypair.verify(hash, tx.signatures[0].signature());
console.log("Is signature valid for TESTNET?", isValid);
