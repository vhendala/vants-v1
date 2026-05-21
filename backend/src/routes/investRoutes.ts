/**
 * investRoutes.ts
 *
 * WHY: Rotas dedicadas ao fluxo de investimento via Defindex Vaults.
 * O backend constrói a transação (XDR) e retorna ao frontend para
 * assinatura via Privy — fluxo 100% não-custodial.
 *
 * Endpoints:
 *   POST /api/invest/build-deposit → Constrói XDR de depósito USDC no Vault
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { buildUsdcDepositTransaction } from "../services/defindex";

const router = Router();

// ─── POST /api/invest/build-deposit ──────────────────────────────────────────

/**
 * Constrói uma transação de depósito de USDC no Vault da Defindex.
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - amount: string — Valor de USDC a depositar (ex: "100.00")
 *
 * Response (200):
 *   { success: true, xdr: "base64..." }
 *
 * Response (400):
 *   { error: "mensagem de validação" }
 *
 * Response (500):
 *   { error: "mensagem de erro" }
 */
router.post(
  "/build-deposit",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, amount } = req.body as {
      publicKey?: string;
      amount?: string;
    };

    // ── Validações ────────────────────────────────────────────────────────────

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({
        error:
          "publicKey é obrigatória e deve ser uma chave pública Stellar válida (G...).",
      });
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({
        error:
          "amount é obrigatório e deve ser um valor numérico positivo (ex: \"100.00\").",
      });
      return;
    }

    // ── Construção da transação via Defindex SDK ──────────────────────────────

    try {
      console.log(
        `[investRoutes] Construindo depósito: ${amount} USDC | caller: ${publicKey}`
      );

      const xdr = await buildUsdcDepositTransaction(publicKey, amount);

      res.status(200).json({ success: true, xdr });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao construir depósito:", error);
      res.status(500).json({
        error: error.message || "Falha ao construir transação de depósito.",
      });
    }
  }
);

export default router;
