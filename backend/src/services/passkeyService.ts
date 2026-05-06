/**
 * services/passkeyService.ts
 *
 * Lógica de registro e verificação de Passkeys (WebAuthn).
 *
 * WHY: Separar a lógica de negócio das rotas Express mantém cada camada
 * com uma responsabilidade única. As rotas apenas delegam; este serviço decide.
 *
 * ABORDAGEM: Nesta fase (MVP), o frontend gera a Passkey via Privy SDK e envia
 * o credentialId + publicKey para o backend. O backend apenas persiste os dados
 * e valida a integridade do payload. Futuras versões podem adicionar verificação
 * de assertion completa (CBOR/COSE decoding) se necessário.
 */

import { prisma } from "../lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PasskeyRegistrationPayload {
  credentialId: string;
  publicKey: string;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  userId: string;
}

// ─── Constantes de validação ──────────────────────────────────────────────────

// credentialId é um Base64URL-encoded ArrayBuffer. Tamanho mínimo realista: 16 bytes → ~22 chars.
const MIN_CREDENTIAL_ID_LENGTH = 16;
// publicKey COSE/Base64 tem no mínimo 32 bytes codificados → ~44 chars.
const MIN_PUBLIC_KEY_LENGTH = 32;

// ─── Funções Públicas ─────────────────────────────────────────────────────────

/**
 * Valida e persiste as credenciais WebAuthn de um usuário já autenticado.
 *
 * WHY: Validamos o payload antes de tocar no banco para garantir
 * que nunca gravamos dados inválidos ou incompletos.
 */
export async function registerPasskey(
  userId: string,
  payload: PasskeyRegistrationPayload
): Promise<PasskeyRegistrationResult> {
  validatePayload(payload);

  // Verifica se o usuário existe antes de atualizar.
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new UserNotFoundError(`Usuário ${userId} não encontrado.`);
  }

  // WHY: Permite sobrescrever uma passkey existente.
  // Em produção, considere versionar ou manter um histórico de credenciais.
  await prisma.user.update({
    where: { id: userId },
    data: {
      passkeyCredentialId: payload.credentialId,
      passkeyPublicKey: payload.publicKey,
    },
  });

  return { success: true, userId };
}

/**
 * Retorna as credenciais de Passkey registradas de um usuário.
 * Útil para autenticações futuras (assertion).
 */
export async function getPasskeyCredentials(
  userId: string
): Promise<{ credentialId: string; publicKey: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passkeyCredentialId: true, passkeyPublicKey: true },
  });

  if (!user?.passkeyCredentialId || !user?.passkeyPublicKey) {
    return null;
  }

  return {
    credentialId: user.passkeyCredentialId,
    publicKey: user.passkeyPublicKey,
  };
}

// ─── Erros Específicos ────────────────────────────────────────────────────────

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

// ─── Funções Privadas ─────────────────────────────────────────────────────────

function validatePayload(payload: PasskeyRegistrationPayload): void {
  if (!payload.credentialId || typeof payload.credentialId !== "string") {
    throw new InvalidPayloadError("credentialId é obrigatório e deve ser uma string.");
  }

  if (!payload.publicKey || typeof payload.publicKey !== "string") {
    throw new InvalidPayloadError("publicKey é obrigatória e deve ser uma string.");
  }

  if (payload.credentialId.length < MIN_CREDENTIAL_ID_LENGTH) {
    throw new InvalidPayloadError(
      `credentialId inválido: muito curto (mínimo ${MIN_CREDENTIAL_ID_LENGTH} caracteres).`
    );
  }

  if (payload.publicKey.length < MIN_PUBLIC_KEY_LENGTH) {
    throw new InvalidPayloadError(
      `publicKey inválida: muito curta (mínimo ${MIN_PUBLIC_KEY_LENGTH} caracteres).`
    );
  }
}
