import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Cria a configuração de Pool do node-postgres usando o URL do Neon.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("A variável DATABASE_URL não está configurada no .env");
}

const pool = new Pool({ connectionString });

// 2. Associa o pool ao Adapter do Prisma
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 3. Exporta o PrismaClient como um Singleton para que em hot-reloads 
// da API não sejam geradas múltiplas conexões
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
