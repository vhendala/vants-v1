/**
 * routes/accountRoutes.ts
 *
 * Rotas de gerenciamento de conta da "Invisible Wallet".
 *
 * WHY: O armazenamento in-memory com Map é intencional para este estágio
 * sem banco de dados. Quando o DB for integrado, apenas o AccountStore
 * será substituído — as rotas permanecem inalteradas. (Separation of Concerns)
 *
 * INVARIANTE DE SEGURANÇA:
 *   - O backend armazena APENAS { publicKey, encryptedSecret }.
 *   - Nunca há logging ou inspeção do conteúdo do encryptedSecret.
 *   - O PIN jamais trafega neste serviço.
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";

const router = Router();

// ─── Store in-memory (substituir por DB na produção) ──────────────────────────

interface AccountRecord {
  publicKey: string;
  encryptedSecret: string;
  createdAt: Date;
}

// Mapeamento: privyUserId → AccountRecord
const accountStore = new Map<string, AccountRecord>();

// ─── Validadores ──────────────────────────────────────────────────────────────

function isValidStellarPublicKey(key: string): boolean {
  // Chaves públicas Stellar começam com 'G' e têm 56 caracteres alfanuméricos
  return /^G[A-Z0-9]{55}$/.test(key);
}

// ─── POST /api/account/secure ─────────────────────────────────────────────────

router.post(
  "/secure",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, encryptedSecret } = req.body as {
      publicKey?: string;
      encryptedSecret?: string;
    };

    // Fail fast: validação de input
    if (!publicKey || typeof publicKey !== "string" || !isValidStellarPublicKey(publicKey)) {
      res.status(400).json({ error: "publicKey inválida." });
      return;
    }

    if (!encryptedSecret || typeof encryptedSecret !== "string" || encryptedSecret.length < 10) {
      res.status(400).json({ error: "encryptedSecret inválido." });
      return;
    }

    const userId = req.user.id;

    // Idempotência: não reescreve uma conta já configurada
    if (accountStore.has(userId)) {
      res.status(409).json({ error: "Conta já configurada para este usuário." });
      return;
    }

    accountStore.set(userId, {
      publicKey,
      encryptedSecret,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Conta configurada com sucesso.",
      publicKey,
    });
  }
);

// ─── GET /api/account/status ──────────────────────────────────────────────────

router.get(
  "/status",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const record = accountStore.get(userId);

    if (!record) {
      res.status(200).json({ hasAccount: false });
      return;
    }

    // Retorna apenas a publicKey — nunca o encryptedSecret
    res.status(200).json({
      hasAccount: true,
      publicKey: record.publicKey,
    });
  }
);

export default router;
