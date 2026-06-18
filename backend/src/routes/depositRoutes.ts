/**
 * depositRoutes.ts
 *
 * WHY: Rotas dedicadas ao fluxo de depósito via Pix (Etherfuse on-ramp).
 * Separadas das accountRoutes para SoC — depósito é uma feature distinta do setup.
 *
 * Fluxo: initiate (quote+order) → simulate-payment (sandbox) → status (polling)
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import { prisma } from "../lib/prisma";
import { etherfuseClient } from "../services/etherfuse";
import { PixPaymentInstructions, SpeiPaymentInstructions } from "../services/etherfuse";

const router = Router();

// ID do Customer do Sandbox configurado no ambiente
const ETHERFUSE_CUSTOMER_ID = process.env.ETHERFUSE_CUSTOMER_ID || "";
const ETHERFUSE_BANK_ACCOUNT_ID = process.env.ETHERFUSE_BANK_ACCOUNT_ID || "";

// ─── POST /api/deposit/initiate ──────────────────────────────────────────────

router.post(
  "/initiate",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { amountBrl } = req.body as { amountBrl?: string };

    if (!amountBrl || parseFloat(amountBrl) <= 0) {
      res.status(400).json({ error: "Valor de depósito inválido." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smartWalletAddress: true, email: true },
    });

    if (!user?.smartWalletAddress) {
      res.status(404).json({ error: "Carteira não encontrada." });
      return;
    }

    try {
      // 0. Auto-aprovação Sandbox: Associa a carteira real do usuário ao Customer e aprova
      // Isso é necessário porque a API Etherfuse exige que a carteira usada na Quote seja previamente aprovada no KYC.
      await etherfuseClient.getKycUrl(ETHERFUSE_CUSTOMER_ID, user.smartWalletAddress, ETHERFUSE_BANK_ACCOUNT_ID);
      await etherfuseClient.submitKycIdentity(ETHERFUSE_CUSTOMER_ID, {
        pubkey: user.smartWalletAddress,
        identity: {
          id: user.smartWalletAddress,
          name: { givenName: "Usuario", familyName: "Vants" },
          dateOfBirth: "1990-01-01",
          email: user.email || "user@vants.app",
          phoneNumber: "+5511999999999",
          occupation: "Desenvolvedor",
          address: {
            street: "Rua Sandbox",
            city: "São Paulo",
            region: "SP",
            postalCode: "01310100",
            country: "BR"
          }
        }
      });

      // 0.1 Buscar contas bancárias existentes para evitar recriação e bloqueio (inactive)
      let dynamicBankAccountId = "";
      try {
        const accountsRes = await fetch(`${process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com"}/ramp/customer/${ETHERFUSE_CUSTOMER_ID}/bank-accounts`, {
          method: "POST", // Etherfuse usa POST para listar contas no backend deles
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.ETHERFUSE_API_KEY || "",
          },
          body: JSON.stringify({ pageSize: 100, pageNumber: 0 })
        });
        
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json() as any;
          if (accountsData.items && accountsData.items.length > 0) {
            // Tenta encontrar uma conta BRL ativa
            const activePixAccount = accountsData.items.find((acc: any) => acc.currency === "brl" && acc.status === "active");
            if (activePixAccount) {
              dynamicBankAccountId = activePixAccount.bankAccountId;
              console.log("[depositRoutes] Conta bancária Pix existente encontrada:", dynamicBankAccountId);
            }
          }
        }

        // Se não encontrou uma conta Pix ativa, cria uma nova
        if (!dynamicBankAccountId) {
          console.log("[depositRoutes] Criando nova conta bancária Pix...");
          const randomCpf = Math.floor(10000000000 + Math.random() * 90000000000).toString().substring(0, 11);
          const bankRes = await fetch(`${process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com"}/ramp/customer/${ETHERFUSE_CUSTOMER_ID}/bank-account`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.ETHERFUSE_API_KEY || "",
            },
            body: JSON.stringify({
              account: {
                transactionId: require("crypto").randomUUID(),
                pixKey: user.email || "user@vants.app",
                pixKeyType: "email",
                firstName: "Usuario",
                lastName: "Vants",
                cpf: randomCpf
              }
            })
          });
          if (bankRes.ok) {
            const bankData = await bankRes.json() as any;
            dynamicBankAccountId = bankData.bankAccountId;
            console.log("[depositRoutes] Nova conta bancária gerada:", dynamicBankAccountId);
          } else {
            console.error("[depositRoutes] Falha ao gerar bank account:", await bankRes.text());
            dynamicBankAccountId = ETHERFUSE_BANK_ACCOUNT_ID; // Fallback
          }
        }
      } catch (e) {
        console.error("Falha ao autogerar bank account", e);
        dynamicBankAccountId = ETHERFUSE_BANK_ACCOUNT_ID; // Fallback
      }

      // 1. Cria quote usando BRL como moeda de origem
      const quote = await etherfuseClient.getQuote({
        fromCurrency: "BRL",
        toCurrency: "TESOURO",
        fromAmount: amountBrl,
        customerId: ETHERFUSE_CUSTOMER_ID,
        stellarAddress: user.smartWalletAddress,
      });

      // 2. Cria order (OnRamp) a partir do quote
      let onRampTx;
      try {
        onRampTx = await etherfuseClient.createOnRamp({
          customerId: ETHERFUSE_CUSTOMER_ID,
          quoteId: quote.id,
          stellarAddress: user.smartWalletAddress,
          fromCurrency: "BRL",
          toCurrency: "TESOURO",
          amount: amountBrl,
          bankAccountId: dynamicBankAccountId
        });
      } catch (rampError: any) {
        if (rampError.statusCode === 409 || rampError.message?.includes("pending onramp order already exists")) {
          throw new Error("Você já possui um depósito pendente com este exato valor. Por favor, tente um valor ligeiramente diferente (ex: R$ " + (Number(amountBrl) + 0.01).toFixed(2).replace('.', ',') + ") ou aguarde alguns minutos.");
        }
        throw rampError;
      }

      // 3. Formata as instruções de pagamento para a resposta (Prioriza Pix)
      let depositClabe = "";
      let depositAmount = Number(amountBrl);
      let depositBankName = "";
      let depositAccountHolder = "";
      let pixCode = "";

      const instructions = onRampTx.paymentInstructions;
      if (instructions) {
        if (instructions.type === "pix") {
          const pixInst = instructions as PixPaymentInstructions;
          pixCode = pixInst.pixCode || pixInst.pixKey || "";
          depositAmount = Number(pixInst.amount) || depositAmount;
          depositAccountHolder = pixInst.beneficiary || "";
        } else if (instructions.type === "spei") {
          const speiInst = instructions as SpeiPaymentInstructions;
          depositClabe = speiInst.clabe;
          depositBankName = speiInst.bankName || "";
          depositAccountHolder = speiInst.beneficiary || "";
          depositAmount = Number(speiInst.amount) || depositAmount;
        }
      }

      res.status(200).json({
        success: true,
        orderId: onRampTx.id,
        // Mantido para compatibilidade com o frontend atual, idealmente o frontend deve usar pixCode
        depositClabe: pixCode || depositClabe, 
        depositAmount: depositAmount,
        depositBankName: depositBankName || "Banco Pix Simulador",
        depositAccountHolder: depositAccountHolder,
        quoteDetails: {
          sourceAmount: quote.fromAmount,
          destinationAmount: quote.toAmount,
          exchangeRate: quote.exchangeRate,
          feeBps: onRampTx.feeBps ? String(onRampTx.feeBps) : "0",
          feeAmount: quote.fee,
          expiresAt: quote.expiresAt,
        },
      });
    } catch (error: any) {
      console.error("[depositRoutes] Erro ao iniciar depósito:", error);
      res.status(500).json({
        error: error.message || "Falha ao iniciar o depósito.",
      });
    }
  }
);

// ─── POST /api/deposit/simulate-payment ──────────────────────────────────────

router.post(
  "/simulate-payment",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { orderId, amountBrl, targetAmount } = req.body as {
      orderId?: string;
      amountBrl?: string;
      targetAmount?: string;
    };

    if (!orderId) {
      res.status(400).json({ error: "orderId é obrigatório." });
      return;
    }

    try {
      // Helper local para simular o pagamento fiat (sandbox only)
      const simulateUrl = `${process.env.ETHERFUSE_API_URL || "https://api.sand.etherfuse.com"}/ramp/order/fiat_received`;
      await fetch(simulateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.ETHERFUSE_API_KEY || "",
        },
        body: JSON.stringify({ orderId }),
      });

      // 3. Loop de Polling (máx 10s) para capturar o hash real da Stellar
      let statusTx = null;
      let stellarTxHash = null;

      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        statusTx = await etherfuseClient.getOnRampTransaction(orderId);
        
        if (statusTx?.stellarTxHash) {
          stellarTxHash = statusTx.stellarTxHash;
          console.log(`[depositRoutes] Hash real da Stellar capturado na tentativa ${i + 1}: ${stellarTxHash}`);
          break;
        }
        console.log(`[depositRoutes] Tentativa ${i + 1}: Hash Stellar ainda não disponível...`);
      }
      
      if (!statusTx) {
         res.status(404).json({ error: "Transação não encontrada após simulação." });
         return;
      }

      const finalAmount = targetAmount || statusTx.toAmount || amountBrl || "0.00";

      // 4. Registra no banco de dados com o melhor ID disponível
      if (statusTx.status === "completed" || statusTx.status === "processing") {
        const existingTx = await prisma.transaction.findFirst({
          where: { userId, description: `Depósito PIX #${orderId.slice(0, 8)}` },
        });

        if (!existingTx) {
          await prisma.transaction.create({
            data: {
              userId,
              type: "DEPOSIT",
              amount: finalAmount,
              asset: "TESOURO",
              status: "COMPLETED",
              txHash: stellarTxHash || `etherfuse-${orderId}`,
              description: `Depósito PIX #${orderId.slice(0, 8)}`,
            },
          });
        }
      }

      res.status(200).json({
        success: true,
        status: statusTx.status,
        finalAmount: finalAmount,
        stellarClaimTransaction: null,
        stellarClaimableBalanceId: null,
        txHash: stellarTxHash,
      });
    } catch (error: any) {
      console.error("[depositRoutes] Erro ao simular pagamento:", error);
      res.status(500).json({
        error: error.message || "Falha ao simular pagamento.",
      });
    }
  }
);

// ─── GET /api/deposit/status/:orderId ────────────────────────────────────────

router.get(
  "/status/:orderId",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;

    if (!orderId) {
      res.status(400).json({ error: "orderId é obrigatório." });
      return;
    }

    try {
      const tx = await etherfuseClient.getOnRampTransaction(orderId);
      
      if (!tx) {
         res.status(404).json({ error: "Transação não encontrada" });
         return;
      }
      
      res.status(200).json({
        status: tx.status,
        stellarClaimTransaction: null,
        txHash: tx.stellarTxHash || null,
      });
    } catch (error: any) {
      console.error("[depositRoutes] Erro ao consultar status:", error);
      res.status(500).json({
        error: error.message || "Falha ao consultar status do depósito.",
      });
    }
  }
);

// ─── POST /api/deposit/atomic-allocate ───────────────────────────────────────

/**
 * Rota Atômica: converte TESOURO → USDC + deposita no Vault Defindex.
 *
 * WHY: Após o depósito Pix (que credita TESOURO na carteira do usuário),
 * esta rota constrói um XDR atômico que:
 *   1. changeTrust para USDC (caso não exista)
 *   2. pathPaymentStrictSend de TESOURO → USDC via SDEX
 *   3. Invoke do contrato Defindex Vault para depositar o USDC
 *
 * O frontend assina uma única vez e submete. Todo o processo é invisível
 * para o usuário — ele vê apenas "Depositando e alocando fundos...".
 *
 * Body:
 *   - publicKey: string — Chave pública Stellar do usuário (G...)
 *   - tesouroAmount: string — Valor de TESOURO a converter (vindo do depósito Pix)
 *
 * Response (200):
 *   { success: true, swapXdr: string, vaultXdr: string, estimatedUsdc: string }
 */
router.post(
  "/atomic-allocate",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { publicKey, tesouroAmount } = req.body as {
      publicKey?: string;
      tesouroAmount?: string;
    };

    if (!publicKey || !publicKey.startsWith("G")) {
      res.status(400).json({
        error:
          "publicKey é obrigatória e deve ser uma chave pública Stellar válida (G...).",
      });
      return;
    }

    if (
      !tesouroAmount ||
      isNaN(parseFloat(tesouroAmount)) ||
      parseFloat(tesouroAmount) <= 0
    ) {
      res.status(400).json({
        error:
          "tesouroAmount é obrigatório e deve ser um valor numérico positivo.",
      });
      return;
    }

    try {
      console.log(
        `[depositRoutes] 🔄 Fluxo atômico: ${tesouroAmount} TESOURO → USDC → Vault | caller: ${publicKey}`
      );

      // ── Step 1: Construir swap TESOURO → USDC ────────────────────────
      const { buildSwapTransaction } = await import(
        "../services/etherfuse/swapService"
      );
      const swapResult = await buildSwapTransaction(publicKey, tesouroAmount);
      const estimatedUsdc = swapResult.quote.toAmount;

      console.log(
        `[depositRoutes] ✅ Swap XDR construído: ~${estimatedUsdc} USDC esperados`
      );

      // ── Step 2: Construir depósito no Vault Defindex ──────────────────
      const { buildUsdcDepositTransaction } = await import(
        "../services/defindex"
      );
      const vaultXdr = await buildUsdcDepositTransaction(
        publicKey,
        estimatedUsdc
      );

      console.log(
        `[depositRoutes] ✅ Vault XDR construído para ${estimatedUsdc} USDC`
      );

      // WHY: Retornamos 2 XDRs separados em vez de tentar combiná-los.
      // O contrato Defindex usa `invokeContractFunction` que pode ter
      // dependências internas incompatíveis com operações SDEX na mesma tx.
      // O frontend assina e submete sequencialmente (swap → vault).
      // Se o swap falhar, o vault não executa. Se o vault falhar,
      // o USDC fica na carteira (o usuário pode investir manualmente depois).

      res.status(200).json({
        success: true,
        swapXdr: swapResult.xdr,
        vaultXdr,
        estimatedUsdc,
        swapQuote: swapResult.quote,
      });
    } catch (error: any) {
      console.error(
        "[depositRoutes] ❌ Erro no fluxo atômico:",
        error.message || error
      );

      let errorMessage =
        "Falha ao preparar a alocação automática. Tente novamente.";
      if (error.message?.includes("liquidez") || error.message?.includes("offers")) {
        errorMessage =
          "Sem liquidez disponível para conversão no momento. Tente novamente em alguns minutos.";
      } else if (error.message?.includes("404") || error.message?.includes("não encontrada")) {
        errorMessage =
          "Conta não encontrada na rede. Verifique se sua carteira está ativada.";
      } else if (error.message?.includes("underfunded")) {
        errorMessage = "Saldo TESOURO insuficiente para esta alocação.";
      }

      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
