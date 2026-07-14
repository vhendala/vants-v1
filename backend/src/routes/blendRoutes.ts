/**
 * blendRoutes.ts — Rotas do "Borrow & Pay" Orchestrator (Blend / Soroban).
 *
 * WHY: O backend monta e simula a transação Soroban e devolve o XDR; o frontend
 * assina com a chave local (Privy/não-custodial) e submete via RPC Soroban.
 *
 * Endpoints:
 *   GET  /api/blend/pool-info  → APYs/liquidez das reservas + posições do usuário
 *   POST /api/blend/build      → Monta XDR de supply/withdraw/borrow/repay
 *   POST /api/blend/record     → Registra o txHash no histórico (Prisma)
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { buildBlendTx, getBlendData, BLEND_ASSETS, type BlendAction } from "../services/blend";
import { prisma } from "../lib/prisma";

const router = Router();

const VALID_ACTIONS: BlendAction[] = ["supply", "withdraw", "borrow", "repay"];

// ─── GET /api/blend/pool-info ────────────────────────────────────────────────

/**
 * Retorna os dados do pool Blend (reservas, APYs, liquidez) e, se `publicKey`
 * for fornecida, as posições do usuário (colateral suprido e dívida).
 *
 * Query: publicKey?: string
 * Response (200): { success: true, pool, reserves, positions }
 */
router.get("/pool-info", async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicKey } = req.query;
    const pk =
      typeof publicKey === "string" && publicKey.startsWith("G")
        ? publicKey
        : undefined;

    const data = await getBlendData(pk);
    res.status(200).json({ success: true, ...data });
  } catch (error: any) {
    console.error("[blendRoutes] Erro ao buscar pool-info:", error);
    res.status(500).json({ error: "Falha ao buscar informações do pool Blend." });
  }
});

// ─── POST /api/blend/build ───────────────────────────────────────────────────

/**
 * Monta a transação Blend (supply/withdraw/borrow/repay) e devolve o XDR
 * assemblado para assinatura no frontend.
 *
 * Body: { publicKey, action, asset, amount }
 * Response (200): { success: true, xdr }
 */
router.post(
  "/build",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, action, asset, amount } = req.body as {
      publicKey?: string;
      action?: string;
      asset?: string;
      amount?: string;
    };

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({
        error: "publicKey é obrigatória e deve ser uma chave Stellar válida (G...).",
      });
      return;
    }
    if (!action || !VALID_ACTIONS.includes(action as BlendAction)) {
      res.status(400).json({
        error: `action é obrigatória e deve ser uma de: ${VALID_ACTIONS.join(", ")}.`,
      });
      return;
    }
    if (!asset || !BLEND_ASSETS[asset]) {
      res.status(400).json({
        error: `asset é obrigatório e deve ser uma reserva suportada (ex: ${Object.keys(BLEND_ASSETS).join(", ")}).`,
      });
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({
        error: 'amount é obrigatório e deve ser um valor numérico positivo (ex: "100.00").',
      });
      return;
    }

    try {
      const xdr = await buildBlendTx(
        publicKey,
        action as BlendAction,
        asset,
        amount
      );
      res.status(200).json({ success: true, xdr });
    } catch (error: any) {
      console.error("[blendRoutes] Erro ao montar transação Blend:", error);
      res.status(500).json({
        error: error.message || "Falha ao montar transação Blend.",
      });
    }
  }
);

// ─── POST /api/blend/record ──────────────────────────────────────────────────

/**
 * Registra um txHash de uma ação Blend no histórico de transações.
 *
 * Body: { txHash, type, amount, asset, description }
 * Response (200): { success: true }
 */
router.post(
  "/record",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { txHash, type, amount, asset, description } = req.body as {
      txHash?: string;
      type?: string;
      amount?: string;
      asset?: string;
      description?: string;
    };

    if (!txHash || !type || !amount) {
      res.status(400).json({ error: "txHash, type e amount são obrigatórios." });
      return;
    }

    try {
      await prisma.transaction.create({
        data: {
          userId,
          type,
          amount: String(amount),
          asset: asset || "XLM",
          status: "COMPLETED",
          txHash,
          description: description || `Blend ${type}`,
        },
      });
      res.status(200).json({ success: true });
    } catch (error: any) {
      // txHash duplicado (P2002) não é erro fatal — a ação já ocorreu on-chain.
      if (error?.code === "P2002") {
        res.status(200).json({ success: true, duplicate: true });
        return;
      }
      console.error("[blendRoutes] Erro ao registrar transação Blend:", error);
      res.status(500).json({ error: "Falha ao registrar transação." });
    }
  }
);

export default router;
