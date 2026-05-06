import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { prisma } from "../lib/prisma";
import {
  activateAccountWithFriendbot,
  submitSignedTransaction,
  sendUsdcPayment,
  getUsdcBalance,
} from "../services/stellarService";

const router = Router();

/**
 * Etapa 1: Ativação via Friendbot (XLM).
 * Registramos como INTERNAL para ocultar no histórico do usuário.
 */
router.post(
  "/setup",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, email } = req.body as { publicKey?: string; email?: string };
    const userId = req.user.id;

    if (!publicKey || !email) {
      res.status(400).json({ error: "publicKey e email são obrigatórios." });
      return;
    }

    try {
      const txHash = await activateAccountWithFriendbot(publicKey);

      await prisma.user.upsert({
        where: { id: userId },
        update: { smartWalletAddress: publicKey },
        create: { id: userId, email, smartWalletAddress: publicKey },
      });

      // Salva como INTERNAL para ocultar no front
      await prisma.transaction.create({
        data: {
          userId,
          type: "PAYMENT", // Usamos PAYMENT aqui pois o front só mostra DEPOSIT/YIELD como positivo
          amount: "10000.00",
          asset: "XLM",
          status: "COMPLETED",
          txHash,
          description: "Internal Activation (XLM)",
        },
      });

      res.status(200).json({ success: true, txHash });
    } catch (error) {
      console.error("[accountRoutes] Erro no setup:", error);
      res.status(500).json({ error: "Falha ao ativar carteira." });
    }
  }
);

/**
 * Etapas 2 e 3: Trustline + Depósito PIX USDC.
 */
router.post(
  "/fund-usdc",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { trustlineXdr } = req.body as { trustlineXdr?: string };
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smartWalletAddress: true },
    });

    if (!user?.smartWalletAddress) {
      res.status(404).json({ error: "Carteira não encontrada." });
      return;
    }

    try {
      // Submete Trustline
      await submitSignedTransaction(trustlineXdr!);

      // Emite USDC (Depósito PIX)
      const paymentTxHash = await sendUsdcPayment(user.smartWalletAddress);

      // Salva como DEPOSIT para o front mostrar sinal "+"
      await prisma.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: "10000.00",
          asset: "USDC",
          status: "COMPLETED",
          txHash: paymentTxHash,
          description: "Depósito PIX",
        },
      });

      res.status(200).json({ success: true, txHash: paymentTxHash });
    } catch (error) {
      console.error("[accountRoutes] Erro no funding USDC:", error);
      res.status(500).json({ error: "Falha no depósito USDC." });
    }
  }
);

router.get(
  "/status",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const record = await prisma.user.findUnique({
      where: { id: userId },
      select: { smartWalletAddress: true },
    });
    res.status(200).json({ hasAccount: !!record?.smartWalletAddress, publicKey: record?.smartWalletAddress });
  }
);

router.get(
  "/balance",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { smartWalletAddress: true } });
    if (!user?.smartWalletAddress) {
      res.status(200).json({ balance: "0.00", asset: "USDC" });
      return;
    }
    const balance = await getUsdcBalance(user.smartWalletAddress);
    res.status(200).json({ balance, asset: "USDC" });
  }
);

export default router;
