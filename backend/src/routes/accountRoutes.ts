/**
 * routes/accountRoutes.ts
 *
 * Rotas de gerenciamento de conta da "Invisible Wallet".
 *
 * INVARIANTE DE SEGURANÇA:
 *   - O backend armazena APENAS { publicKey, encryptedSecret }.
 *   - Nunca há logging ou inspeção do conteúdo do encryptedSecret.
 *   - O PIN jamais trafega neste serviço.
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { prisma } from "../lib/prisma";
import { deploySmartWallet } from "../services/stellarService";

const router = Router();

// ─── POST /api/account/secure ─────────────────────────────────────────────────

router.post(
  "/secure",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { email, passkeyCredentialId, passkeyPublicKey } = req.body as {
      email?: string;
      passkeyCredentialId?: string;
      passkeyPublicKey?: string;
    };

    // Fail fast: validação de base do Privy
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Email inválido ou ausente." });
      return;
    }

    if (!passkeyPublicKey || typeof passkeyPublicKey !== "string") {
      res.status(400).json({ error: "passkeyPublicKey é obrigatório." });
      return;
    }

    const userId = req.user.id;

    try {
      // Call deploySmartWallet to create and fund the wallet on Stellar Testnet
      const smartWalletAddress = await deploySmartWallet(passkeyPublicKey);

      // Upsert: cria ou atualiza o status de smart wallet da conta invisível
      const account = await prisma.user.upsert({
        where: { id: userId },
        update: {
          passkeyCredentialId,
          passkeyPublicKey,
          smartWalletAddress,
        },
        create: {
          id: userId,
          email,
          passkeyCredentialId: passkeyCredentialId || null,
          passkeyPublicKey,
          smartWalletAddress,
        },
      });

      res.status(201).json({
        message: "Conta processada com sucesso.",
        smartWalletAddress: account.smartWalletAddress,
      });
    } catch (error) {
      console.error("[accountRoutes] Erro ao configurar Account Abstraction:", error);
      res.status(500).json({ error: "Falha interna ao configurar a conta." });
    }
  }
);

// ─── GET /api/account/status ──────────────────────────────────────────────────

router.get(
  "/status",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;

    try {
      const record = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          smartWalletAddress: true,
          passkeyCredentialId: true,
        },
      });

      if (!record || !record.smartWalletAddress) {
        res.status(200).json({ hasAccount: false });
        return;
      }

      // Retorna sucesso para injetar estado no Frontend (dashboard)
      res.status(200).json({
        hasAccount: true,
        smartWalletAddress: record.smartWalletAddress,
        hasPasskey: !!record.passkeyCredentialId,
      });
    } catch (error) {
      console.error("[accountRoutes] Erro ao buscar status:", error);
      res.status(500).json({ error: "Falha interna ao buscar status da conta." });
    }
  }
);

export default router;
