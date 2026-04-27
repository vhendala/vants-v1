import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { prisma } from "../lib/prisma";

const router = Router();

// ─── GET /api/transactions/history ────────────────────────────────────────────────

router.get(
  "/history",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    try {
      // Busca transações ordenadas pela mais recente
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        ...(limit ? { take: limit } : {}),
      });

      res.status(200).json({ transactions });
    } catch (error) {
      console.error("[transactionRoutes] Erro ao buscar histórico de transações:", error);
      res.status(500).json({ error: "Falha interna ao buscar histórico de transações." });
    }
  }
);

export default router;
