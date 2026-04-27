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
import { deploySmartWallet, getWalletBalance } from "../services/stellarService";

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
    } catch (error: any) {
      console.error("[accountRoutes] Erro ao configurar Account Abstraction:", {
        error: error?.message || String(error),
        stack: error?.stack,
        response: error?.response?.data,
      });
      
      // Provide more specific error message based on error type
      const errorMessage = 
        error?.message?.includes("Stellar") || error?.response?.data
          ? "Erro ao criar wallet na rede Stellar. Tente novamente."
          : "Falha interna ao configurar a conta.";
      
      res.status(500).json({ error: errorMessage });
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

// ─── GET /api/account/balance ──────────────────────────────────────────────────

router.get(
  "/balance",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;

    try {
      // Query user record to get their smart wallet address
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          smartWalletAddress: true,
        },
      });

      // If user doesn't have a wallet address yet, return 0.00
      if (!user || !user.smartWalletAddress) {
        console.log("[accountRoutes] User has no wallet address yet:", userId);
        res.status(200).json({ balance: "0.00" });
        return;
      }

      console.log("[accountRoutes] Fetching balance for wallet:", user.smartWalletAddress);

      // Fetch balance from Stellar
      const balance = await getWalletBalance(user.smartWalletAddress);

      res.status(200).json({ balance });
    } catch (error) {
      console.error("[accountRoutes] Erro ao buscar saldo:", error);
      res.status(500).json({ error: "Falha interna ao buscar saldo da conta." });
    }
  }
);

// ─── POST /api/account/setup ──────────────────────────────────────────────────

router.post(
  "/setup",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey } = req.body as {
      publicKey?: string;
    };

    const userId = req.user.id;

    if (!publicKey || typeof publicKey !== "string") {
      res.status(400).json({ error: "publicKey é obrigatório." });
      return;
    }

    try {
      console.log(`[accountRoutes] Funding account via Friendbot: ${publicKey}`);

      // 1. Friendbot Activation
      const friendbotUrl = `https://friendbot.stellar.org/?addr=${publicKey}`;
      const fbResponse = await fetch(friendbotUrl);
      
      if (!fbResponse.ok) {
        throw new Error("Falha ao financiar conta via Friendbot.");
      }
      
      const fbData = (await fbResponse.json()) as { hash: string };
      const txHash = fbData.hash;

      console.log(`[accountRoutes] Friendbot success, txHash: ${txHash}`);

      // 2. Update User
      await prisma.user.update({
        where: { id: userId },
        data: {
          smartWalletAddress: publicKey,
        },
      });

      // 3. Create initial funding transaction
      await prisma.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: "10000.00",
          asset: "XLM",
          status: "COMPLETED",
          txHash,
          description: "Initial Funding - Vants Testnet",
        },
      });

      res.status(200).json({
        success: true,
        message: "Carteira configurada e financiada com sucesso.",
        txHash,
      });
    } catch (error: any) {
      console.error("[accountRoutes] Erro no setup da conta:", error);
      res.status(500).json({ error: "Falha ao configurar e financiar a carteira." });
    }
  }
);

export default router;
