/**
 * cryptoService.ts
 *
 * Serviço de criptografia para a "Invisible Wallet" da Vants.
 * Responsabilidade única: gerar e proteger chaves Stellar com AES via PIN.
 *
 * WHY: O backend nunca deve ver a chave privada. Todo o ciclo de vida
 * criptográfico acontece exclusivamente no cliente, dentro deste módulo.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import CryptoJS from "crypto-js";

export interface StellarAccount {
  publicKey: string;
  secretKey: string;
}

/**
 * Gera um par de chaves Stellar completamente novo.
 * A chave secreta JAMAIS deve ser persistida em texto puro.
 */
export function generateAccount(): StellarAccount {
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

/**
 * Cifra a chave secreta Stellar usando AES com o PIN do usuário como passphrase.
 * Retorna uma string opaca (ciphertext) que pode ser armazenada com segurança.
 *
 * @param secretKey - A chave secreta Stellar (começa com 'S')
 * @param pin       - O PIN de 6 dígitos definido pelo usuário
 */
export function encryptSecret(secretKey: string, pin: string): string {
  return CryptoJS.AES.encrypt(secretKey, pin).toString();
}

/**
 * Decifra o blob criptografado usando o PIN.
 * Lança um erro se o PIN for incorreto (o resultado decifrado seria inválido).
 *
 * @param encryptedSecret - O blob ciphertext armazenado
 * @param pin             - O PIN de 6 dígitos do usuário
 */
export function decryptSecret(encryptedSecret: string, pin: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedSecret, pin);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  if (!decrypted || !decrypted.startsWith("S")) {
    throw new Error("PIN inválido ou dados corrompidos.");
  }

  return decrypted;
}
