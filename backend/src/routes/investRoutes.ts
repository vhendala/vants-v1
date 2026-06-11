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
import { buildUsdcDepositTransaction, getUsdcVaultApy, getUsdcVaultBalance } from "../services/defindex";
import { getSwapQuote, buildSwapTransaction } from "../services/etherfuse/swapService";

const router = Router();

// ─── GET /api/invest/vault-info ──────────────────────────────────────────────

/**
 * Retorna as informações atuais do Vault de USDC (ex: APY).
 *
 * Query:
 *   - publicKey?: string — Se fornecido, retorna também o saldo investido.
 *
 * Response (200):
 *   { success: true, apy: number, userBalance?: number }
 */
router.get("/vault-info", async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.query;
    
    const apy = await getUsdcVaultApy();
    
    let userBalance = 0;
    if (typeof publicKey === "string" && publicKey.startsWith("G")) {
      userBalance = await getUsdcVaultBalance(publicKey);
    }
    
    res.status(200).json({ success: true, apy, userBalance });
  } catch (error: any) {
    console.error("[investRoutes] Erro ao buscar vault-info:", error);
    res.status(500).json({ error: "Falha ao buscar informações do vault." });
  }
});

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

// ─── POST /api/invest/build-withdraw ─────────────────────────────────────────

/**
 * Constrói uma transação de resgate de USDC do Vault da Defindex.
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - amount: string — Valor de USDC a resgatar (ex: "5.00")
 *
 * Response (200):
 *   { success: true, xdr: "base64..." }
 */
router.post(
  "/build-withdraw",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, amount } = req.body as {
      publicKey?: string;
      amount?: string;
    };

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({
        error: "publicKey é obrigatória e deve ser uma chave pública Stellar válida (G...).",
      });
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({
        error: "amount é obrigatório e deve ser um valor numérico positivo (ex: \"5.00\").",
      });
      return;
    }

    try {
      console.log(`[investRoutes] Construindo resgate: ${amount} USDC | caller: ${publicKey}`);
      const { buildUsdcWithdrawTransaction } = await import("../services/defindex");
      const xdr = await buildUsdcWithdrawTransaction(publicKey, amount);
      res.status(200).json({ success: true, xdr });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao construir resgate:", error);
      res.status(500).json({
        error: error.message || "Falha ao construir transação de resgate.",
      });
    }
  }
);

// ─── POST /api/invest/swap-quote ─────────────────────────────────────────────

/**
 * Retorna uma cotação de conversão TESOURO → USDC (BRL → USD na UI).
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - amount: string — Valor de TESOURO/BRL a converter (ex: "100.00")
 *
 * Response (200):
 *   { success: true, rate, fromAmount, toAmount, fee, quoteId }
 */
router.post(
  "/swap-quote",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, amount } = req.body as {
      publicKey?: string;
      amount?: string;
    };

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

    try {
      console.log(
        `[investRoutes] Cotação de swap: ${amount} TESOURO → USDC | caller: ${publicKey}`
      );

      const quoteData = await getSwapQuote(publicKey, amount);

      res.status(200).json({ 
        success: true, 
        rate: quoteData.rate, 
        fromAmount: quoteData.fromAmount, 
        toAmount: quoteData.toAmount, 
        fee: quoteData.fee,
        quoteId: quoteData.quoteId 
      });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao buscar cotação de swap:", error);
      res.status(500).json({
        error: error.message || "Falha ao obter cotação de conversão.",
      });
    }
  }
);

// ─── POST /api/invest/build-swap ─────────────────────────────────────────────

/**
 * Constrói uma transação de swap TESOURO → USDC (BRL → USD na UI).
 * Retorna o XDR não-assinado para o frontend assinar com a chave local.
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - amount: string — Valor de TESOURO/BRL a converter (ex: "100.00")
 *
 * Response (200):
 *   { success: true, xdr: "base64...", quote: { rate, fromAmount, toAmount, fee } }
 */
router.post(
  "/build-swap",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, amount } = req.body as {
      publicKey?: string;
      amount?: string;
    };

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

    try {
      console.log(
        `[investRoutes] Construindo swap: ${amount} TESOURO → USDC | caller: ${publicKey}`
      );

      const result = await buildSwapTransaction(publicKey, amount);

      res.status(200).json({ success: true, xdr: result.xdr, quote: result.quote });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao construir swap:", error);
      res.status(500).json({
        error: error.message || "Falha ao construir transação de conversão.",
      });
    }
  }
);

// ─── POST /api/invest/submit-swap ─────────────────────────────────────────────

/**
 * Submete a transação de swap assinada (Fase 1: changeTrust + pathPaymentStrictSend)
 *
 * Body:
 *   - signedXdr: string (XDR assinado pelo usuário)
 *   - fromAmount: string (TESOURO)
 *   - toAmount: string (USDC)
 *   - userPublicKey: string (chave pública do usuário)
 */
router.post(
  "/submit-swap",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { signedXdr, fromAmount, toAmount, userPublicKey } = req.body;

    if (!signedXdr || !fromAmount || !toAmount || !userPublicKey) {
      res.status(400).json({ error: "signedXdr, fromAmount, toAmount, userPublicKey são obrigatórios." });
      return;
    }

    try {
      const { submitSignedTransaction } = await import("../services/stellarService");
      const { prisma } = await import("../lib/prisma");

      // Submete o XDR do usuário (changeTrust + pathPaymentStrictSend na SDEX)
      const txHash = await submitSignedTransaction(signedXdr);
      console.log(`[investRoutes] Swap Atômico concluído | txHash: ${txHash}`);

      // Registra a conversão no histórico
      await prisma.transaction.create({
        data: {
          userId,
          type: "PAYMENT",
          amount: fromAmount,
          asset: "TESOURO",
          status: "COMPLETED",
          txHash,
          description: `Conversão para ${parseFloat(toAmount).toFixed(2)} USDC`,
        },
      });

      res.status(200).json({ success: true, txHash });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao submeter conversão:", error);

      let errorMessage = "Falha ao submeter a conversão para a rede Stellar.";
      if (error.response?.data?.extras?.result_codes) {
        const codes = error.response.data.extras.result_codes;
        if (codes.operations?.includes("op_underfunded") || codes.transaction === "tx_failed") {
          errorMessage = "Saldo insuficiente para realizar a conversão.";
        } else if (codes.operations?.includes("op_too_few_offers")) {
          errorMessage = "Conversão temporariamente indisponível. Falta de liquidez.";
        } else {
          errorMessage = `Erro na rede Stellar: ${JSON.stringify(codes)}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

// ─── POST /api/invest/build-reverse-swap ─────────────────────────────────────

/**
 * Constrói uma transação de reverse swap USDC → TESOURO (USD → BRL na UI).
 * Usada no saque atômico. Recebe a quantidade EXATA de TESOURO (BRL) desejada
 * e retorna o XDR junto com a quantidade máxima de USDC necessária.
 *
 * Body:
 *   - publicKey: string
 *   - amount: string (Valor em TESOURO/BRL que se deseja receber, ex: "100.00")
 */
router.post(
  "/build-reverse-swap",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, amount } = req.body as {
      publicKey?: string;
      amount?: string;
    };

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({ error: "publicKey é obrigatória e deve ser válida (G...)." });
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({ error: "amount é obrigatório e deve ser numérico." });
      return;
    }

    try {
      console.log(`[investRoutes] Construindo reverse swap USDC → ${amount} TESOURO | caller: ${publicKey}`);
      const { buildReverseSwapTransaction } = await import("../services/etherfuse/swapService");
      
      const result = await buildReverseSwapTransaction(publicKey, amount);

      res.status(200).json({ success: true, xdr: result.xdr, usdcRequired: result.usdcRequired });
    } catch (error: any) {
      console.error("[investRoutes] Erro ao construir reverse swap:", error);
      res.status(500).json({
        error: error.message || "Falha ao construir transação de reverse swap.",
      });
    }
  }
);

export default router;
