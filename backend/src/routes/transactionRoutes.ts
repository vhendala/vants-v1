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

// ─── POST /api/transactions/transfer/build ──────────────────────────────────────

router.post(
  "/transfer/build",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { destination, amount } = req.body;

    if (!destination || !amount) {
      res.status(400).json({ error: "Parâmetros 'destination' e 'amount' são obrigatórios." });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { smartWalletAddress: true },
      });

      if (!user || !user.smartWalletAddress) {
        res.status(404).json({ error: "Carteira do usuário não encontrada." });
        return;
      }

      const { buildTransferUsdcTransaction } = await import("../services/stellarService");
      const unsignedXdr = await buildTransferUsdcTransaction(
        user.smartWalletAddress,
        destination,
        amount
      );

      res.status(200).json({ unsignedXdr });
    } catch (error) {
      console.error("[transactionRoutes] Erro ao construir transferência:", error);
      res.status(500).json({ error: "Falha ao construir a transação." });
    }
  }
);

// ─── POST /api/transactions/transfer/submit ─────────────────────────────────────

router.post(
  "/transfer/submit",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { signedXdr, amount, destination } = req.body;

    if (!signedXdr || !amount || !destination) {
      res.status(400).json({ error: "signedXdr, amount, destination são obrigatórios." });
      return;
    }

    try {
      const { submitSignedTransaction } = await import("../services/stellarService");
      
      const txHash = await submitSignedTransaction(signedXdr);

      // Salva no banco de dados como PAYMENT para que apareça no histórico
      await prisma.transaction.create({
        data: {
          userId,
          type: "PAYMENT",
          amount: amount,
          asset: "USDC",
          status: "COMPLETED",
          txHash: txHash,
          description: `Transferência para ${destination.substring(0, 4)}...${destination.slice(-4)}`,
        },
      });

      res.status(200).json({ success: true, txHash });
    } catch (error: any) {
      console.error("[transactionRoutes] Erro ao submeter transferência:", error);
      
      let errorMessage = "Falha ao submeter a transação assinada.";
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        console.error("Result codes:", codes);
        if (codes.operations?.includes("op_no_destination")) {
          errorMessage = "Conta de destino não existe na rede Stellar.";
        } else if (codes.operations?.includes("op_no_trust")) {
          errorMessage = "A conta de destino não possui linha de confiança (Trustline) para USDC.";
        } else if (codes.operations?.includes("op_underfunded")) {
          errorMessage = "Saldo insuficiente para realizar a transferência.";
        } else {
          errorMessage = `Erro na rede Stellar: ${JSON.stringify(codes)}`;
        }
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

// ─── POST /api/transactions/withdraw/build ────────────────────────────────────

router.post(
  "/withdraw/build",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount) {
      res.status(400).json({ error: "Parâmetro 'amount' é obrigatório." });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { smartWalletAddress: true },
      });

      if (!user || !user.smartWalletAddress) {
        res.status(404).json({ error: "Carteira do usuário não encontrada." });
        return;
      }

      const { buildWithdrawTesouroTransaction } = await import("../services/stellarService");
      const unsignedXdr = await buildWithdrawTesouroTransaction(
        user.smartWalletAddress,
        amount
      );

      res.status(200).json({ unsignedXdr });
    } catch (error) {
      console.error("[transactionRoutes] Erro ao construir saque:", error);
      res.status(500).json({ error: "Falha ao construir a transação de saque." });
    }
  }
);

// ─── POST /api/transactions/withdraw/submit ───────────────────────────────────

router.post(
  "/withdraw/submit",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { signedXdr, amount } = req.body;

    if (!signedXdr || !amount) {
      res.status(400).json({ error: "signedXdr e amount são obrigatórios." });
      return;
    }

    try {
      const { submitSignedTransaction } = await import("../services/stellarService");
      
      const txHash = await submitSignedTransaction(signedXdr);

      // Salva no banco de dados como WITHDRAWAL para que apareça no histórico com formatação própria
      await prisma.transaction.create({
        data: {
          userId,
          type: "WITHDRAWAL",
          amount: amount,
          asset: "TESOURO",
          status: "COMPLETED",
          txHash: txHash,
          description: "Saque PIX",
        },
      });

      res.status(200).json({ success: true, txHash });
    } catch (error: any) {
      console.error("[transactionRoutes] Erro ao submeter saque:", error);
      
      let errorMessage = "Falha ao submeter o saque para a rede Stellar.";
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        console.error("Result codes (Withdrawal):", JSON.stringify(codes, null, 2));
        
        if (codes.operations?.includes("op_underfunded")) {
          errorMessage = "Saldo insuficiente para realizar o saque.";
        } else if (codes.operations?.includes("op_no_trust") || codes.operations?.includes("op_no_destination")) {
          errorMessage = "A conta de destino (Carteira Vants) não está pronta para receber este ativo.";
        } else {
          errorMessage = `Erro na Stellar: ${JSON.stringify(codes)}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
