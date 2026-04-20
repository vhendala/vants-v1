/**
 * index.ts — Ponto de entrada do servidor Vants Backend.
 *
 * WHY: Configuração mínima e deliberada. Cada middleware tem um propósito
 * justificado. CORS restritivo por padrão para evitar abuso em produção.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import accountRoutes from "./routes/accountRoutes";
import transactionRoutes from "./routes/transactionRoutes";

// ─── Constantes de configuração ───────────────────────────────────────────────

const PORT = process.env.PORT ?? 4000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

// CORS: permite apenas origens explicitamente configuradas
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite chamadas sem origin (Postman, health checks internos)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body parser: limita payload a 50kb para mitigar ataques de payload gigante
app.use(express.json({ limit: "50kb" }));

// ─── Rotas ────────────────────────────────────────────────────────────────────

// Health check público — útil para load balancers e CI/CD
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint para verificar configuração (apenas em dev)
app.get("/debug/env", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Not available in production" });
    return;
  }
  
  res.status(200).json({
    nodeEnv: process.env.NODE_ENV,
    hasStellarSecret: !!process.env.STELLAR_SPONSOR_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPrivyAppId: !!process.env.PRIVY_APP_ID,
    hasPrivyAppSecret: !!process.env.PRIVY_APP_SECRET,
    allowedOrigins: ALLOWED_ORIGINS,
    port: PORT,
  });
});

// Rotas de conta (Invisible Wallet)
app.use("/api/account", accountRoutes);

// Rotas de transações (Histórico)
app.use("/api/transactions", transactionRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Vants Backend rodando em http://localhost:${PORT}`);
  console.log(`   Origens CORS permitidas: ${ALLOWED_ORIGINS.join(", ")}`);
});

export default app;

