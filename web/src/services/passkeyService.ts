// Passkey Service for Soroban Smart Wallets
// Based on: https://kalepail.com/blockchain/the-passkey-powered-future-of-web3
// Reference: https://github.com/kalepail/soroban-passkey

export interface PasskeyCredential {
  id: string;
  publicKey: string; // secp256r1 public key in base64
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
}

export interface PasskeyAccount {
  credentialId: string;
  publicKey: string;
  contractAddress?: string; // Soroban contract address
  createdAt: number;
}

class PasskeyService {
  private readonly STORAGE_KEY = 'vantis_passkey_accounts';
  private readonly RP_ID = window.location.hostname; // Relying Party ID
  private readonly RP_NAME = 'Vantis';

  // Check if passkeys are supported
  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && 
           'PublicKeyCredential' in window &&
           typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  }

  // Register a new passkey (create account)
  async register(username: string): Promise<PasskeyAccount> {
    try {
      // Check if passkeys are supported
      const supported = await this.isSupported();
      if (!supported) {
        throw new Error('Passkeys are not supported on this browser');
      }

      // Check if user verifying platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Platform authenticator is not available');
      }

      // Create credential options
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          id: this.RP_ID,
          name: this.RP_NAME,
        },
        user: {
          id: new TextEncoder().encode(username),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7, // ES256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extract public key from attestation object
      const publicKey = this.extractPublicKey(response);

      const passkeyAccount: PasskeyAccount = {
        credentialId: this.arrayBufferToBase64(credential.rawId),
        publicKey,
        createdAt: Date.now(),
      };

      // Store the passkey account
      await this.savePasskeyAccount(passkeyAccount);

      return passkeyAccount;
    } catch (error: any) {
      throw new Error(`Failed to register passkey: ${error.message || error}`);
    }
  }

  // Authenticate with existing passkey (sign in)
  async authenticate(): Promise<PasskeyAccount> {
    try {
      const supported = await this.isSupported();
      if (!supported) {
        throw new Error('Passkeys are not supported on this browser');
      }

      // Get saved passkey accounts
      const accounts = await this.getPasskeyAccounts();
      if (accounts.length === 0) {
        throw new Error('No passkey account found. Please register first.');
      }

      // For now, use the first account (in production, show account picker)
      const account = accounts[0];

      // Create challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: this.RP_ID,
        allowCredentials: [
          {
            id: this.base64ToArrayBuffer(account.credentialId),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication failed');
      }

      return account;
    } catch (error: any) {
      throw new Error(`Failed to authenticate: ${error.message || error}`);
    }
  }

  // Sign data with passkey (for transaction signing)
  async sign(account: PasskeyAccount, data: string): Promise<string> {
    try {
      // Create challenge from data
      const challenge = new Uint8Array(32);
      const dataHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      challenge.set(new Uint8Array(dataHash));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: this.RP_ID,
        allowCredentials: [
          {
            id: this.base64ToArrayBuffer(account.credentialId),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      // Get credential (this will trigger authentication)
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication required for signing');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Return signature (clientDataJSON + authenticatorData + signature)
      const signature = {
        clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
        authenticatorData: this.arrayBufferToBase64(response.authenticatorData),
        signature: this.arrayBufferToBase64(response.signature),
      };

      return JSON.stringify(signature);
    } catch (error: any) {
      throw new Error(`Failed to sign: ${error.message || error}`);
    }
  }

  // Get all saved passkey accounts
  async getPasskeyAccounts(): Promise<PasskeyAccount[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      return [];
    }
  }

  // Save passkey account
  private async savePasskeyAccount(account: PasskeyAccount): Promise<void> {
    const accounts = await this.getPasskeyAccounts();
    // Check if account already exists
    const existingIndex = accounts.findIndex(
      a => a.credentialId === account.credentialId,
    );
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
  }

  // Delete passkey account
  async deletePasskeyAccount(credentialId: string): Promise<void> {
    const accounts = await this.getPasskeyAccounts();
    const filtered = accounts.filter(a => a.credentialId !== credentialId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  // Link Soroban contract address to passkey account
  async linkContractAddress(
    credentialId: string,
    contractAddress: string,
  ): Promise<void> {
    const accounts = await this.getPasskeyAccounts();
    const account = accounts.find(a => a.credentialId === credentialId);
    if (account) {
      account.contractAddress = contractAddress;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
    }
  }

  // Extract public key from attestation object
  private extractPublicKey(_response: AuthenticatorAttestationResponse): string {
    // In production, parse the CBOR attestation object to extract the public key
    // For now, return a mock public key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Helper: ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper: Base64 to ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const passkeyService = new PasskeyService();

