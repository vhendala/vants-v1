require('dotenv').config();
const { DefindexSDK, SupportedNetworks } = require('@defindex/sdk');
const StellarSdk = require('@stellar/stellar-sdk');

async function main() {
  const sdk = new DefindexSDK({ apiKey: process.env.DEFINDEX_API_KEY, baseUrl: 'https://api.defindex.io' });
  const keypair = StellarSdk.Keypair.random();
  await fetch('https://friendbot.stellar.org?addr=' + keypair.publicKey());
  const mockedUsdcContractId = new StellarSdk.Asset('USDC', process.env.ISSUER_PUBLIC_KEY).contractId(StellarSdk.Networks.TESTNET);
  
  const vaultConfig = {
    roles: { emergencyManager: keypair.publicKey(), feeReceiver: keypair.publicKey(), manager: keypair.publicKey(), rebalanceManager: keypair.publicKey() },
    vaultFeeBps: 100,
    assets: [{
      address: mockedUsdcContractId,
      strategies: []
    }],
    name: 'Vants Mock Vault', symbol: 'VMOCK', upgradable: true, caller: keypair.publicKey()
  };
  const res = await sdk.createVault(vaultConfig, SupportedNetworks.TESTNET).catch(e => console.error(JSON.stringify(e)));
  
  if (!res || !res.xdr) return console.log('Failed');

  const tx = StellarSdk.TransactionBuilder.fromXDR(res.xdr, StellarSdk.Networks.TESTNET);
  tx.sign(keypair);

  const sendRes = await fetch('https://api.defindex.io/send?network=testnet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.DEFINDEX_API_KEY },
    body: JSON.stringify({ xdr: tx.toXDR() })
  });
  console.log('Deployed:', await sendRes.json());
}
main().catch(console.error);
