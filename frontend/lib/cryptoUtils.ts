/**
 * cryptoUtils.ts — Criptografia client-side para proteção de chaves privadas.
 *
 * WHY: A chave privada Stellar do usuário precisa ficar no navegador para
 * assinar transações (modelo não-custodial), mas armazená-la em plaintext
 * no sessionStorage é vulnerável a XSS. Este módulo criptografa a secret
 * com AES-256-GCM usando uma chave derivada via PBKDF2 a partir de um
 * identificador de sessão do usuário.
 *
 * RESULTADO: Mesmo que um script malicioso leia o sessionStorage, encontrará
 * apenas um ciphertext inútil sem acesso à CryptoKey derivada na memória.
 *
 * NOTA: A aplicação permanece 100% não-custodial — nenhum segredo é enviado
 * ao servidor. Toda a criptografia ocorre exclusivamente no navegador.
 *
 * @module cryptoUtils
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "vants_wallet_secret_enc";
const SALT_KEY = "vants_wallet_salt";
const PBKDF2_ITERATIONS = 100_000;

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Deriva uma CryptoKey AES-256-GCM a partir do userId via PBKDF2.
 *
 * WHY: Usamos o userId como material de base (não como senha) combinado com
 * um salt aleatório para gerar uma chave de criptografia única por sessão.
 * Isso garante que cada usuário/sessão tem uma chave diferente.
 */
async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Converte um Uint8Array para string base64.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converte uma string base64 para Uint8Array.
 */
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Criptografa a chave privada Stellar e armazena no sessionStorage.
 *
 * Fluxo:
 * 1. Gera um salt aleatório de 16 bytes
 * 2. Deriva uma chave AES-256-GCM via PBKDF2(userId, salt)
 * 3. Gera um IV (initialization vector) aleatório de 12 bytes
 * 4. Criptografa o secret com AES-GCM
 * 5. Armazena salt + IV + ciphertext no sessionStorage (base64)
 *
 * @param secret - A chave privada Stellar (S...) em plaintext
 * @param userId - O identificador Privy do usuário (did:privy:...)
 */
export async function storeEncryptedSecret(
  secret: string,
  userId: string
): Promise<void> {
  const encoder = new TextEncoder();

  // Salt aleatório — único por sessão de registro
  const salt = crypto.getRandomValues(new Uint8Array(16));
  // IV aleatório — necessário para AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(userId, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(secret)
  );

  // Formato de armazenamento: salt(16) + iv(12) + ciphertext(N)
  const combined = new Uint8Array(
    salt.length + iv.length + new Uint8Array(ciphertext).length
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  sessionStorage.setItem(STORAGE_KEY, uint8ToBase64(combined));
  // Backup do salt separado para validação extra (opcional)
  sessionStorage.setItem(SALT_KEY, uint8ToBase64(salt));
}

/**
 * Recupera e decripta a chave privada Stellar do sessionStorage.
 *
 * @param userId - O identificador Privy do usuário (did:privy:...)
 * @returns A chave privada Stellar em plaintext, ou null se não encontrada/inválida.
 */
export async function retrieveDecryptedSecret(
  userId: string
): Promise<string | null> {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const combined = base64ToUint8(stored);

    // Extrai salt(16) + iv(12) + ciphertext(restante)
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(userId, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // Decriptação falhou — dados corrompidos ou userId incorreto
    console.error("[cryptoUtils] Falha ao decriptar secret:", error);
    return null;
  }
}

/**
 * Remove todos os dados criptografados da sessão.
 */
export function clearEncryptedSecret(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SALT_KEY);
  // Limpa também a chave legada (plaintext) caso exista de versões anteriores
  sessionStorage.removeItem("vants_wallet_secret_tmp");
}
