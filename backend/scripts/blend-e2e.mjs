// E2E on-chain: replica EXATAMENTE a sequência de services/blend/client.ts
// (PoolContractV2.submit + prepareTransaction) e de blend-flow.tsx (sign +
// sendTransaction + poll getTransaction) numa conta nova de testnet.
// Temporário; safe to delete.
import { PoolContractV2, RequestType } from '@blend-capital/blend-sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

const NETWORK = { rpc: 'https://soroban-testnet.stellar.org', passphrase: StellarSdk.Networks.TESTNET };
const POOL = 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF';
const ASSETS = {
  XLM: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  USDC: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
};
const USDC_ISSUER = 'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56';
const horizon = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// O USDC do Blend é um SAC clássico → precisa de trustline para receber (borrow).
async function ensureUsdcTrustline(user, keypair) {
  process.stdout.write('→ changeTrust USDC ... ');
  const acc = await horizon.loadAccount(user);
  const tx = new StellarSdk.TransactionBuilder(acc, { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: new StellarSdk.Asset('USDC', USDC_ISSUER) }))
    .setTimeout(60).build();
  tx.sign(keypair);
  const r = await horizon.submitTransaction(tx);
  console.log('OK', r.hash);
  await wait(3000);
}
const REQ = { supply: RequestType.SupplyCollateral, withdraw: RequestType.WithdrawCollateral, borrow: RequestType.Borrow, repay: RequestType.Repay };
const server = new StellarSdk.rpc.Server(NETWORK.rpc);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// === Mirror de buildBlendTx (backend) ===
async function buildBlendTx(user, action, symbol, amount) {
  const account = await server.getAccount(user);
  const contract = new PoolContractV2(POOL);
  const opB64 = contract.submit({
    from: user, spender: user, to: user,
    requests: [{ request_type: REQ[action], address: ASSETS[symbol], amount: BigInt(Math.round(parseFloat(amount) * 1e7)) }],
  });
  const op = StellarSdk.xdr.Operation.fromXDR(opB64, 'base64');
  const tx = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(op).setTimeout(300).build();
  return (await server.prepareTransaction(tx)).toXDR();
}

// === Mirror do submit do frontend (blend-flow.tsx) ===
async function signSubmitPoll(xdr, keypair) {
  const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, NETWORK.passphrase);
  tx.sign(keypair);
  const sent = await server.sendTransaction(tx);
  if (String(sent.status) === 'ERROR') throw new Error('sendTransaction ERROR: ' + JSON.stringify(sent.errorResult?.result?.()?.switch?.()?.name || sent.errorResult));
  let res = await server.getTransaction(sent.hash);
  let tries = 0;
  while (String(res.status) === 'NOT_FOUND' && tries < 30) { await wait(1000); res = await server.getTransaction(sent.hash); tries++; }
  if (String(res.status) !== 'SUCCESS') throw new Error('status final: ' + res.status);
  return sent.hash;
}

async function run(user, keypair, action, symbol, amount) {
  process.stdout.write(`\n→ ${action} ${amount} ${symbol} ... `);
  const xdr = await buildBlendTx(user, action, symbol, amount);
  const hash = await signSubmitPoll(xdr, keypair);
  console.log('OK', hash);
  return hash;
}

const kp = StellarSdk.Keypair.random();
const user = kp.publicKey();
console.log('Conta de teste:', user);
console.log('Secret:', kp.secret());
console.log('Funding via Friendbot...');
await fetch('https://friendbot.stellar.org/?addr=' + user);
await wait(4000);

const hashes = {};
hashes.supply = await run(user, kp, 'supply', 'XLM', '100');     // COLLATERAL log
await ensureUsdcTrustline(user, kp);
hashes.borrow = await run(user, kp, 'borrow', 'USDC', '5');       // BORROW log
hashes.repay = await run(user, kp, 'repay', 'USDC', '5');         // BORROW (repay) log
hashes.withdraw = await run(user, kp, 'withdraw', 'XLM', '50');   // COLLATERAL (withdraw) log

console.log('\n========= EVIDÊNCIAS (Stellar Expert testnet) =========');
console.log('Pool (IDs dos Contratos):', POOL);
console.log('XLM:', ASSETS.XLM, '| USDC:', ASSETS.USDC);
for (const [k, h] of Object.entries(hashes)) {
  console.log(`${k.padEnd(9)} https://stellar.expert/explorer/testnet/tx/${h}`);
}
