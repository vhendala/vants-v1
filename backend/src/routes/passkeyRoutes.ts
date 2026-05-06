/**
 * routes/passkeyRoutes.ts
 *
 * Rotas de registro e consulta de Passkeys.
 *
 * WHY: Rotas separadas por domínio (account, transaction, passkey) mantêm
 * o código organizado e evitam que accountRoutes.ts acumule responsabilidades.
 */

import { Router, Request, Response } from "express";
import { verifyPrivyToken } from "../middleware/verifyPrivyToken";
import {
  registerPasskey,
  getPasskeyCredentials,
  InvalidPayloadError,
  UserNotFoundError,
} from "../services/passkeyService";

const router = Router();

// ─── POST /api/passkey/register ───────────────────────────────────────────────

/**
 * Registra as credenciais WebAuthn do usuário autenticado.
 *
 * Body esperado:
 * {
 *   "credentialId": "base64url-encoded-credential-id",
 *   "publicKey": "base64url-encoded-public-key"
 * }
 *
 * Resposta 200:
 * { "success": true, "userId": "did:privy:..." }
 */
router.post(
  "/register",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    const { credentialId, publicKey } = req.body as {
      credentialId?: string;
      publicKey?: string;
    };

    try {
      const result = await registerPasskey(req.user.id, {
        credentialId: credentialId ?? "",
        publicKey: publicKey ?? "",
      });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidPayloadError) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      console.error("[passkeyRoutes] Erro inesperado no registro:", error);
      res.status(500).json({ error: "Falha interna ao registrar passkey." });
    }
  }
);

// ─── GET /api/passkey/credentials ────────────────────────────────────────────

/**
 * Retorna se o usuário já possui uma Passkey registrada.
 *
 * WHY: Útil para o frontend decidir se deve exibir o fluxo de
 * cadastro ou apenas o de autenticação biométrica.
 *
 * Resposta 200 com passkey:
 * { "hasPasskey": true, "credentialId": "...", "publicKey": "..." }
 *
 * Resposta 200 sem passkey:
 * { "hasPasskey": false }
 */
router.get(
  "/credentials",
  verifyPrivyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials = await getPasskeyCredentials(req.user.id);

      if (!credentials) {
        res.status(200).json({ hasPasskey: false });
        return;
      }

      res.status(200).json({ hasPasskey: true, ...credentials });
    } catch (error) {
      console.error("[passkeyRoutes] Erro ao buscar credenciais:", error);
      res.status(500).json({ error: "Falha interna ao buscar credenciais." });
    }
  }
);

export default router;
