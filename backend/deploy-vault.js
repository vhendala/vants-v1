require('dotenv').config();
const { DefindexSDK, SupportedNetworks } = require('@defindex/sdk');
const StellarSdk = require('@stellar/stellar-sdk');

async function main() {
  const sdk = new DefindexSDK({
    apiKey: process.env.DEFINDEX_API_KEY,
    baseUrl: 'https://api.defindex.io'
  });

  const keypair = StellarSdk.Keypair.random();
  console.log('Funding', keypair.publicKey());
  await fetch('https://friendbot.stellar.org?addr=' + keypair.publicKey());

  const vaultConfig = {
    roles: {
      emergencyManager: keypair.publicKey(),
      feeReceiver: keypair.publicKey(),
      manager: keypair.publicKey(),
      rebalanceManager: keypair.publicKey()
    },
    vaultFeeBps: 100,
    assets: [{
      address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Etherfuse USDC SAC
      strategies: []
    }],
    name: 'Vants USDC Vault',
    symbol: 'VUSDC',
    upgradable: true,
    caller: keypair.publicKey()
  };

  console.log('Creating vault...');
  const res = await sdk.createVault(vaultConfig, SupportedNetworks.TESTNET);
  
  if (!res.xdr) {
    console.error('Failed to create vault', res);
    return;
  }

  console.log('Signing...');
  const tx = StellarSdk.TransactionBuilder.fromXDR(res.xdr, StellarSdk.Networks.TESTNET);
  tx.sign(keypair);

  console.log('Sending...');
  const sendRes = await fetch('https://api.defindex.io/send?network=testnet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.DEFINDEX_API_KEY
    },
    body: JSON.stringify({ xdr: tx.toXDR() })
  });

  const result = await sendRes.json();
  console.log('Deployed:', result);
  
  // Return the predicted vault address or let the user find it in explorer
  if (res.simulationResponse && res.simulationResponse.result && res.simulationResponse.result.retval) {
      console.log('Simulation response available.');
  }
}

main().catch(console.error);
