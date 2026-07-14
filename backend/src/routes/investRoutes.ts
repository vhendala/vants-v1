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

// ─── POST /api/invest/generic-swap ───────────────────────────────────────────

/**
 * Swap genérico entre BRL (TESOURO), USD (USDC) e XLM via SDEX.
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - fromAsset: "BRL" | "USD" | "XLM"
 *   - toAsset: "BRL" | "USD" | "XLM"
 *   - amount: string — Valor a enviar (em fromAsset)
 *
 * Response (200):
 *   { success: true, xdr, quote: { fromAmount, toAmount, rate } }
 */
router.post(
  "/generic-swap",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, fromAsset, toAsset, amount } = req.body as {
      publicKey?: string;
      fromAsset?: string;
      toAsset?: string;
      amount?: string;
    };

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({ error: "publicKey inválida." });
      return;
    }
    if (!fromAsset || !toAsset || fromAsset === toAsset) {
      res.status(400).json({ error: "fromAsset e toAsset são obrigatórios e devem ser diferentes." });
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({ error: "amount é obrigatório e deve ser positivo." });
      return;
    }

    const TESOURO_ISSUER = process.env.TESOURO_ISSUER_PUBLIC_KEY || "GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4";
    const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

    const { default: StellarSdk } = await import("@stellar/stellar-sdk") as any;
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

    const resolveAsset = (code: string) => {
      if (code === "BRL") return new StellarSdk.Asset("TESOURO", TESOURO_ISSUER);
      if (code === "USD") return new StellarSdk.Asset("USDC", USDC_ISSUER);
      if (code === "XLM") return StellarSdk.Asset.native();
      throw new Error(`Moeda desconhecida: ${code}`);
    };

    try {
      console.log(`[investRoutes] Generic swap: ${amount} ${fromAsset} → ${toAsset} | caller: ${publicKey}`);

      const sendAsset = resolveAsset(fromAsset);
      const destAsset = resolveAsset(toAsset);

      // Busca paths na SDEX
      const paths = await server.strictSendPaths(sendAsset, amount, [destAsset]).call();
      if (!paths.records || paths.records.length === 0) {
        throw new Error(`Sem liquidez na SDEX para converter ${fromAsset} → ${toAsset}.`);
      }

      const bestPath = paths.records[0];
      const expectedOutput = parseFloat(bestPath.destination_amount);
      const minDestinationAmount = (expectedOutput * 0.98).toFixed(7);
      const rate = (expectedOutput / parseFloat(amount)).toFixed(6);

      const sourceAccount = await server.loadAccount(publicKey);
      const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Garante trustlines necessárias
      if (fromAsset === "BRL" || toAsset === "BRL") {
        txBuilder.addOperation(StellarSdk.Operation.changeTrust({ asset: resolveAsset("BRL"), source: publicKey }));
      }
      if (fromAsset === "USD" || toAsset === "USD") {
        txBuilder.addOperation(StellarSdk.Operation.changeTrust({ asset: resolveAsset("USD"), source: publicKey }));
      }

      // Swap via pathPaymentStrictSend
      txBuilder.addOperation(
        StellarSdk.Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount: parseFloat(amount).toFixed(7),
          destAsset,
          destMin: minDestinationAmount,
          destination: publicKey,
          path: bestPath.path
            .filter((p: any) => p.asset_type !== "native" && p.asset_code && p.asset_issuer)
            .map((p: any) => new StellarSdk.Asset(p.asset_code, p.asset_issuer)),
          source: publicKey,
        })
      );

      const tx = txBuilder.setTimeout(120).build();
      const xdr = tx.toXDR();

      console.log(`[investRoutes] ✅ Generic swap XDR construído → min ${minDestinationAmount} ${toAsset}`);

      res.status(200).json({
        success: true,
        xdr,
        quote: {
          fromAmount: amount,
          fromAsset,
          toAmount: expectedOutput.toFixed(7),
          toAsset,
          minDestinationAmount,
          rate,
        },
      });
    } catch (error: any) {
      console.error("[investRoutes] Erro no generic swap:", error.message);
      res.status(500).json({ error: error.message || "Falha ao construir swap." });
    }
  }
);

export default router;
