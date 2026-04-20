/**
 * middleware/verifyPrivyToken.ts
 *
 * Middleware de autenticação via Privy.
 * Valida o Bearer token JWT do cliente e injeta o userId no request.
 *
 * WHY: Centralizar a verificação de token aqui elimina duplicação
 * e garante que NENHUMA rota protegida esqueça de validar identidade.
 */

import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";

const PRIVY_APP_ID = process.env.PRIVY_APP_ID as string;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET as string;

// Validação na inicialização
if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.error("[verifyPrivyToken] Missing PRIVY_APP_ID or PRIVY_APP_SECRET in environment");
}

// Cliente Privy compartilhado — instanciado uma única vez (singleton)
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

// Extensão do tipo Request para expor o userId verificado
declare global {
  namespace Express {
    interface Request {
      user: { id: string };
    }
  }
}

export async function verifyPrivyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação ausente." });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const { userId } = await privy.verifyAuthToken(token);
    req.user = { id: userId };
    next();
  } catch (error: any) {
    console.error("[verifyPrivyToken] Token verification failed:", {
      error: error?.message,
      stack: error?.stack,
    });
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
